import AppKit
import Foundation

private let pollInterval: TimeInterval = 5

@main
final class FlambeMenuBarApp: NSObject, NSApplicationDelegate {
  private let endpoint = Endpoint.fromProcess()
  private let statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
  private let connectionMenuItem = NSMenuItem(title: "Checking Flambe…", action: nil, keyEquivalent: "")
  private let previewMenuItem = NSMenuItem(title: "Preview Disconnected Flame", action: nil, keyEquivalent: "")
  private var timer: Timer?
  private var activeAgentCount: Int?
  private var previewingDisconnected = false

  static func main() {
    let application = NSApplication.shared
    let delegate = FlambeMenuBarApp()
    application.delegate = delegate
    application.setActivationPolicy(.accessory)
    application.run()
  }

  func applicationDidFinishLaunching(_ notification: Notification) {
    configureMenu()
    checkConnection()
    timer = Timer.scheduledTimer(timeInterval: pollInterval, target: self, selector: #selector(checkConnection), userInfo: nil, repeats: true)
  }

  func applicationWillTerminate(_ notification: Notification) {
    timer?.invalidate()
  }

  private func configureMenu() {
    guard let button = statusItem.button else { return }
    button.toolTip = "Flambe: checking connection"
    button.image = icon(activeAgentCount: nil)

    let menu = NSMenu()
    menu.addItem(connectionMenuItem)
    menu.addItem(NSMenuItem.separator())

    let checkNow = NSMenuItem(title: "Check Now", action: #selector(checkConnection), keyEquivalent: "r")
    checkNow.target = self
    menu.addItem(checkNow)

    previewMenuItem.action = #selector(toggleDisconnectedPreview)
    previewMenuItem.target = self
    menu.addItem(previewMenuItem)

    let quit = NSMenuItem(title: "Quit Flambe Status", action: #selector(quit), keyEquivalent: "q")
    quit.target = self
    menu.addItem(quit)
    statusItem.menu = menu
  }

  @objc private func checkConnection() {
    var request = URLRequest(url: endpoint.statusURL)
    request.timeoutInterval = 3
    request.cachePolicy = .reloadIgnoringLocalCacheData
    request.setValue("Bearer \(endpoint.token)", forHTTPHeaderField: "Authorization")

    URLSession.shared.dataTask(with: request) { [weak self] data, response, _ in
      let activeAgentCount = parseActiveAgentCount(response, data)
      DispatchQueue.main.async {
        self?.setConnectionStatus(activeAgentCount: activeAgentCount)
      }
    }.resume()
  }

  private func setConnectionStatus(activeAgentCount: Int?) {
    self.activeAgentCount = activeAgentCount
    renderStatus()
  }

  private func renderStatus() {
    let displayAgentCount = previewingDisconnected ? nil : activeAgentCount
    let label = label(for: displayAgentCount, previewingDisconnected: previewingDisconnected)
    connectionMenuItem.title = "Flambe: \(label)"
    statusItem.button?.toolTip = "Flambe: \(label) (\(endpoint.baseURL.absoluteString))"
    statusItem.button?.image = icon(activeAgentCount: displayAgentCount)
    previewMenuItem.title = previewingDisconnected ? "Show Live Flame" : "Preview Disconnected Flame"
  }

  private func label(for activeAgentCount: Int?, previewingDisconnected: Bool) -> String {
    if previewingDisconnected { return "Disconnected preview" }
    guard let activeAgentCount else { return "Unavailable" }
    if activeAgentCount == 0 { return "Connected; no active agents" }
    if activeAgentCount == 1 { return "Connected; 1 active agent" }
    return "Connected; \(activeAgentCount) active agents"
  }

  private func icon(activeAgentCount: Int?) -> NSImage? {
    let level: FlameLevel

    switch activeAgentCount ?? 0 {
    case 0: level = .unavailable
    case 1: level = .oneAgent
    default: level = .multipleAgents
    }

    let symbolName = level == .unavailable ? "flame" : "flame.fill"
    guard let symbol = NSImage(systemSymbolName: symbolName, accessibilityDescription: "Flambe connection") else {
      return nil
    }

    let sizeConfiguration = NSImage.SymbolConfiguration(pointSize: 15, weight: .semibold)
    let colorConfiguration = NSImage.SymbolConfiguration(paletteColors: [level.color])
    let configuredSymbol = symbol.withSymbolConfiguration(sizeConfiguration.applying(colorConfiguration)) ?? symbol
    let image = NSImage(size: NSSize(width: 18, height: 18), flipped: false) { rect in
      let context = NSGraphicsContext.current?.cgContext

      if level != .unavailable {
        context?.setShadow(offset: .zero, blur: level.glowBlur, color: level.color.cgColor)
      }

      configuredSymbol.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)

      if level == .multipleAgents,
         let sparkles = NSImage(systemSymbolName: "sparkles", accessibilityDescription: "Multiple agents"),
         let configuredSparkles = sparkles.withSymbolConfiguration(
           NSImage.SymbolConfiguration(pointSize: 8, weight: .bold)
             .applying(NSImage.SymbolConfiguration(paletteColors: [.white]))
         ) {
        configuredSparkles.draw(
          in: NSRect(x: 10, y: 10, width: 8, height: 8),
          from: .zero,
          operation: .sourceOver,
          fraction: 0.95
        )
      }

      return true
    }
    image.isTemplate = false
    return image
  }

  @objc private func quit() {
    NSApp.terminate(nil)
  }

  @objc private func toggleDisconnectedPreview() {
    previewingDisconnected.toggle()
    renderStatus()
  }
}

private enum FlameLevel {
  case unavailable
  case oneAgent
  case multipleAgents

  var color: NSColor {
    switch self {
    case .unavailable: return .labelColor
    case .oneAgent: return .systemOrange
    case .multipleAgents: return .systemBlue
    }
  }

  var glowBlur: CGFloat {
    switch self {
    case .unavailable: return 0
    case .oneAgent: return 0
    case .multipleAgents: return 4
    }
  }
}

private struct Endpoint {
  let baseURL: URL
  let token: String

  var statusURL: URL {
    baseURL.appendingPathComponent("api/agent-status")
  }

  static func fromProcess() -> Endpoint {
    let arguments = CommandLine.arguments
    let argumentURL = arguments.indices.dropLast().first { arguments[$0] == "--url" }.map { arguments[$0 + 1] }
    let configuredURL = argumentURL ?? ProcessInfo.processInfo.environment["FLAMBE_URL"] ?? "http://localhost:4001"
    let normalizedURL = configuredURL.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    guard let token = ProcessInfo.processInfo.environment["FLAMBE_API_TOKEN"], !token.isEmpty else {
      fatalError("FlambeMenuBar requires FLAMBE_API_TOKEN to read agent status")
    }

    guard let baseURL = URL(string: normalizedURL), baseURL.scheme != nil, baseURL.host != nil else {
      fatalError("FlambeMenuBar requires a valid --url or FLAMBE_URL, for example http://localhost:4001")
    }

    return Endpoint(baseURL: baseURL, token: token)
  }
}

private func parseActiveAgentCount(_ response: URLResponse?, _ data: Data?) -> Int? {
  guard let httpResponse = response as? HTTPURLResponse, (200..<300).contains(httpResponse.statusCode), let data else {
    return nil
  }

  let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
  return payload?["active_agents"] as? Int
}
