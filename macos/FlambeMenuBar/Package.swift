// swift-tools-version: 5.7
import PackageDescription

let package = Package(
  name: "FlambeMenuBar",
  platforms: [.macOS(.v13)],
  products: [
    .executable(name: "FlambeMenuBar", targets: ["FlambeMenuBar"]),
  ],
  targets: [
    .executableTarget(name: "FlambeMenuBar"),
  ]
)
