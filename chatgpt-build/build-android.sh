#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"
BUILD_DIR="$ROOT/chatgpt-build/work"
SDK_DIR="${ANDROID_SDK_ROOT:-${ANDROID_HOME:-$HOME/android-sdk}}"
GRADLE_DIR="$HOME/.cache/comedian-companion-gradle-9.6.0"

echo "Reconstructing Android project..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
base64 -d "$ROOT/chatgpt-build/payload.b64" > /tmp/comedian-companion-src.zip
echo "f915ca0a9a18db6148a19484e049da3344aa5344e276fda4efb1b8e29fa8121e  /tmp/comedian-companion-src.zip" | sha256sum -c -
unzip -q /tmp/comedian-companion-src.zip -d "$BUILD_DIR"

if [ -n "${JAVA_HOME_17_X64:-}" ]; then
  export JAVA_HOME="$JAVA_HOME_17_X64"
  export PATH="$JAVA_HOME/bin:$PATH"
fi
java -version

if ! command -v sdkmanager >/dev/null 2>&1; then
  echo "Android sdkmanager not found; bootstrapping command-line tools."
  mkdir -p "$SDK_DIR/cmdline-tools"
  curl -fL --retry 3 https://dl.google.com/android/repository/commandlinetools-linux-15859902_latest.zip -o /tmp/android-tools.zip
  echo "4e4c464f145a7512b57d088ac6c278c03c9eea610886b35a5e0804e74eedf583  /tmp/android-tools.zip" | sha256sum -c -
  rm -rf /tmp/android-cmdline
  mkdir -p /tmp/android-cmdline
  unzip -q /tmp/android-tools.zip -d /tmp/android-cmdline
  rm -rf "$SDK_DIR/cmdline-tools/latest"
  mv /tmp/android-cmdline/cmdline-tools "$SDK_DIR/cmdline-tools/latest"
  export ANDROID_SDK_ROOT="$SDK_DIR"
  export ANDROID_HOME="$SDK_DIR"
  export PATH="$SDK_DIR/cmdline-tools/latest/bin:$SDK_DIR/platform-tools:$PATH"
fi

yes | sdkmanager --licenses >/dev/null || true
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"

if [ ! -x "$GRADLE_DIR/bin/gradle" ]; then
  echo "Installing Gradle 9.6.0..."
  mkdir -p "$(dirname "$GRADLE_DIR")"
  rm -rf "$GRADLE_DIR"
  curl -fL --retry 3 https://services.gradle.org/distributions/gradle-9.6.0-bin.zip -o /tmp/gradle-9.6.0-bin.zip
  rm -rf /tmp/gradle-unpack
  mkdir -p /tmp/gradle-unpack
  unzip -q /tmp/gradle-9.6.0-bin.zip -d /tmp/gradle-unpack
  mv /tmp/gradle-unpack/gradle-9.6.0 "$GRADLE_DIR"
fi
export PATH="$GRADLE_DIR/bin:$PATH"

gradle --version

cd "$BUILD_DIR"
sed -i 's/compileSdk = 37/compileSdk = 36/; s/targetSdk = 37/targetSdk = 36/' app/build.gradle.kts
sed -i '/android.defaults.buildfeatures/d' gradle.properties
gradle :app:assembleDebug --stacktrace --no-daemon

cd "$ROOT"
mkdir -p dist
cp "$BUILD_DIR/app/build/outputs/apk/debug/app-debug.apk" dist/comedian-companion-debug.apk
sha256sum dist/comedian-companion-debug.apk | tee dist/comedian-companion-debug.apk.sha256
node chatgpt-build/upload-artifact.mjs
