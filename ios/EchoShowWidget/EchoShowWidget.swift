import WidgetKit
import SwiftUI

// MARK: - Data models

struct RemoteEntry: TimelineEntry {
    let date: Date
    let deviceName: String
    let isConnected: Bool
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> RemoteEntry {
        RemoteEntry(date: Date(), deviceName: "Echo Show", isConnected: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (RemoteEntry) -> Void) {
        completion(RemoteEntry(date: Date(), deviceName: loadDeviceName(), isConnected: false))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<RemoteEntry>) -> Void) {
        let entry = RemoteEntry(date: Date(), deviceName: loadDeviceName(), isConnected: false)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }

    private func loadDeviceName() -> String {
        let defaults = UserDefaults(suiteName: "group.com.echoshow.remote")
        return defaults?.string(forKey: "deviceName") ?? "Echo Show"
    }
}

// MARK: - Widget views

struct EchoShowWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        switch family {
        case .systemSmall:   SmallWidgetView(entry: entry)
        case .systemMedium:  MediumWidgetView(entry: entry)
        case .systemLarge:   LargeWidgetView(entry: entry)
        default:             SmallWidgetView(entry: entry)
        }
    }
}

// ── Small (2×2) ──────────────────────────────────────────────────────────────
struct SmallWidgetView: View {
    let entry: RemoteEntry

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#131921"), Color(hex: "#1A2535")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "hifispeaker.2.fill")
                        .foregroundColor(Color(hex: "#00CAFF"))
                        .font(.system(size: 16, weight: .bold))
                    Spacer()
                    Circle()
                        .fill(entry.isConnected ? Color.green : Color.gray)
                        .frame(width: 7, height: 7)
                }
                Text("Echo Show")
                    .font(.system(size: 12, weight: .bold))
                    .foregroundColor(.white)
                Spacer()
                Link(destination: URL(string: "echoremote://alexa")!) {
                    Label("Alexa", systemImage: "mic.fill")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color(hex: "#131921"))
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(Color(hex: "#00CAFF"))
                        .cornerRadius(10)
                }
            }
            .padding(14)
        }
    }
}

// ── Medium (4×2) ──────────────────────────────────────────────────────────────
struct MediumWidgetView: View {
    let entry: RemoteEntry

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#131921"), Color(hex: "#1A2535")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            VStack(spacing: 10) {
                HStack {
                    Image(systemName: "hifispeaker.2.fill")
                        .foregroundColor(Color(hex: "#00CAFF"))
                    Text(entry.deviceName)
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)
                    Spacer()
                    HStack(spacing: 4) {
                        Circle()
                            .fill(entry.isConnected ? Color.green : Color.gray)
                            .frame(width: 7, height: 7)
                        Text(entry.isConnected ? "Connected" : "Offline")
                            .font(.system(size: 11))
                            .foregroundColor(entry.isConnected ? .green : .gray)
                    }
                }
                HStack(spacing: 10) {
                    WidgetActionButton(icon: "backward.fill", action: "rewind", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "playpause.fill", action: "play_pause", color: Color(hex: "#FF9900"), textColor: Color(hex: "#131921"))
                    WidgetActionButton(icon: "forward.fill", action: "fast_forward", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "speaker.slash.fill", action: "mute", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "house.fill", action: "home", color: Color(hex: "#37475A"))
                }
                Link(destination: URL(string: "echoremote://alexa")!) {
                    HStack {
                        Image(systemName: "mic.fill")
                        Text("Ask Alexa")
                            .fontWeight(.bold)
                    }
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(Color(hex: "#131921"))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color(hex: "#00CAFF"))
                    .cornerRadius(12)
                }
            }
            .padding(14)
        }
    }
}

// ── Large (4×4) ──────────────────────────────────────────────────────────────
struct LargeWidgetView: View {
    let entry: RemoteEntry

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "#131921"), Color(hex: "#1A2535")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            VStack(spacing: 12) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Echo Show Remote")
                            .font(.system(size: 15, weight: .bold))
                            .foregroundColor(.white)
                        Text(entry.deviceName)
                            .font(.system(size: 12))
                            .foregroundColor(Color(hex: "#00CAFF"))
                    }
                    Spacer()
                    HStack(spacing: 4) {
                        Circle()
                            .fill(entry.isConnected ? Color.green : Color.gray)
                            .frame(width: 8, height: 8)
                        Text(entry.isConnected ? "Online" : "Offline")
                            .font(.system(size: 11))
                            .foregroundColor(entry.isConnected ? .green : .gray)
                    }
                }

                Divider().background(Color.gray.opacity(0.3))

                // Playback row
                Text("Playback")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: 12) {
                    WidgetActionButton(icon: "backward.fill", action: "rewind", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "playpause.fill", action: "play_pause", color: Color(hex: "#FF9900"), textColor: Color(hex: "#131921"))
                    WidgetActionButton(icon: "forward.fill", action: "fast_forward", color: Color(hex: "#37475A"))
                }

                // Volume row
                Text("Volume")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: 12) {
                    WidgetActionButton(icon: "speaker.minus.fill", action: "volume_down", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "speaker.slash.fill", action: "mute", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "speaker.plus.fill", action: "volume_up", color: Color(hex: "#37475A"))
                }

                // Nav row
                Text("Navigation")
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(.gray)
                    .frame(maxWidth: .infinity, alignment: .leading)
                HStack(spacing: 12) {
                    WidgetActionButton(icon: "house.fill", action: "home", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "arrow.backward", action: "back", color: Color(hex: "#37475A"))
                    WidgetActionButton(icon: "power", action: "power", color: Color(hex: "#E8272C"))
                }

                Spacer()

                // Alexa CTA
                Link(destination: URL(string: "echoremote://alexa")!) {
                    HStack {
                        Image(systemName: "mic.fill")
                        Text("Tap to Ask Alexa")
                            .fontWeight(.bold)
                    }
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(Color(hex: "#131921"))
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(Color(hex: "#00CAFF"))
                    .cornerRadius(14)
                }
            }
            .padding(16)
        }
    }
}

// ── Reusable widget action button ─────────────────────────────────────────────
struct WidgetActionButton: View {
    let icon: String
    let action: String
    let color: Color
    var textColor: Color = .white

    var body: some View {
        Link(destination: URL(string: "echoremote://\(action)")!) {
            Image(systemName: icon)
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(textColor)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 10)
                .background(color)
                .cornerRadius(10)
        }
    }
}

// MARK: - Widget definition

@main
struct EchoShowWidgetBundle: WidgetBundle {
    var body: some Widget {
        EchoShowWidgetExtension()
    }
}

struct EchoShowWidgetExtension: Widget {
    let kind: String = "EchoShowWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            EchoShowWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Echo Show Remote")
        .description("Control your Echo Show and ask Alexa without opening the app.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Color extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r, g, b: UInt64
        switch hex.count {
        case 6:
            (r, g, b) = ((int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
        default:
            (r, g, b) = (0, 0, 0)
        }
        self.init(red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255)
    }
}
