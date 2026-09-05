using System.Drawing.Drawing2D;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace FlambeTaskbar;

internal static class Program
{
    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();
        try
        {
            Application.Run(new FlambeApplicationContext(Endpoint.FromProcess(args)));
        }
        catch (Exception exception)
        {
            MessageBox.Show(exception.Message, "Flambe Status", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}

internal sealed class FlambeApplicationContext : ApplicationContext
{
    private readonly Endpoint endpoint;
    private readonly NotifyIcon tray;
    private readonly ToolStripMenuItem statusItem;
    private readonly ToolStripMenuItem urlItem;
    private readonly ToolStripMenuItem previewItem;
    private readonly SynchronizationContext ui;
    private AgentStatusStream? stream;
    private CancellationTokenSource? reconnect;
    private int? activeAgentCount;
    private bool previewingDisconnected;
    private Icon? currentIcon;

    public FlambeApplicationContext(Endpoint endpoint)
    {
        this.endpoint = endpoint;
        ui = SynchronizationContext.Current ?? new SynchronizationContext();

        statusItem = new ToolStripMenuItem("Flambe: Checking connection") { Enabled = false };
        urlItem = new ToolStripMenuItem(endpoint.StatusStreamUrl.AbsoluteUri) { Enabled = false };
        previewItem = new ToolStripMenuItem("Preview Disconnected Flame", null, (_, _) => ToggleDisconnectedPreview());

        var menu = new ContextMenuStrip();
        menu.Items.Add(statusItem);
        menu.Items.Add(urlItem);
        menu.Items.Add(new ToolStripSeparator());
        menu.Items.Add(new ToolStripMenuItem("Reconnect", null, (_, _) => Reconnect()));
        menu.Items.Add(previewItem);
        menu.Items.Add(new ToolStripMenuItem("Quit Flambe Status", null, (_, _) => ExitThread()));

        tray = new NotifyIcon
        {
            Visible = true,
            ContextMenuStrip = menu,
            Text = "Flambe: checking connection",
        };
        tray.MouseUp += (_, eventArgs) =>
        {
            if (eventArgs.Button == MouseButtons.Left)
            {
                tray.GetType().GetMethod("ShowContextMenu", System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.NonPublic)
                    ?.Invoke(tray, null);
            }
        };

        Render();
        Connect();
    }

    protected override void ExitThreadCore()
    {
        reconnect?.Cancel();
        stream?.Stop();
        tray.Visible = false;
        tray.Dispose();
        currentIcon?.Dispose();
        base.ExitThreadCore();
    }

    private void Connect()
    {
        reconnect?.Cancel();
        stream?.Stop();
        stream = new AgentStatusStream(
            endpoint,
            count => ui.Post(_ => SetConnectionStatus(count), null),
            () => ui.Post(_ =>
            {
                SetConnectionStatus(null);
                ScheduleReconnect();
            }, null));
        stream.Start();
    }

    private void ScheduleReconnect()
    {
        reconnect?.Cancel();
        reconnect = new CancellationTokenSource();
        var token = reconnect.Token;
        _ = Task.Run(async () =>
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(5), token);
                ui.Post(_ => Connect(), null);
            }
            catch (TaskCanceledException)
            {
            }
        });
    }

    private void Reconnect()
    {
        SetConnectionStatus(null);
        Connect();
    }

    private void SetConnectionStatus(int? count)
    {
        activeAgentCount = count;
        Render();
    }

    private void ToggleDisconnectedPreview()
    {
        previewingDisconnected = !previewingDisconnected;
        Render();
    }

    private void Render()
    {
        var displayCount = previewingDisconnected ? null : activeAgentCount;
        var label = LabelFor(displayCount, previewingDisconnected);
        statusItem.Text = $"Flambe: {label}";
        tray.Text = Truncate($"Flambe: {label} ({endpoint.BaseUrl.AbsoluteUri})");
        previewItem.Text = previewingDisconnected ? "Show Live Flame" : "Preview Disconnected Flame";

        var nextIcon = FlameIcons.For(displayCount);
        tray.Icon = nextIcon;
        currentIcon?.Dispose();
        currentIcon = nextIcon;
    }

    private static string LabelFor(int? activeAgentCount, bool previewingDisconnected)
    {
        if (previewingDisconnected) return "Disconnected preview";
        if (activeAgentCount is null) return "Unavailable";
        if (activeAgentCount == 0) return "Connected; no active agents";
        if (activeAgentCount == 1) return "Connected; 1 active agent";
        return $"Connected; {activeAgentCount} active agents";
    }

    private static string Truncate(string text) =>
        text.Length <= 63 ? text : string.Concat(text.AsSpan(0, 60), "...");
}

internal readonly record struct Endpoint(Uri BaseUrl, string Token)
{
    public Uri StatusStreamUrl => new(BaseUrl, "/api/agent-status/stream");

    public static Endpoint FromProcess(string[] arguments)
    {
        string? argumentUrl = null;
        for (var index = 0; index < arguments.Length - 1; index += 1)
        {
            if (arguments[index] == "--url") argumentUrl = arguments[index + 1];
        }

        var configuredUrl = argumentUrl
            ?? Environment.GetEnvironmentVariable("FLAMBE_URL")
            ?? "http://localhost:4001";
        configuredUrl = configuredUrl.TrimEnd('/');
        var token = Environment.GetEnvironmentVariable("FLAMBE_API_TOKEN");
        if (string.IsNullOrWhiteSpace(token))
        {
            throw new InvalidOperationException("FlambeTaskbar requires FLAMBE_API_TOKEN to read agent status");
        }

        if (!Uri.TryCreate(configuredUrl, UriKind.Absolute, out var baseUrl) || baseUrl.Host is "")
        {
            throw new InvalidOperationException("FlambeTaskbar requires a valid --url or FLAMBE_URL, for example http://localhost:4001");
        }

        return new Endpoint(baseUrl, token);
    }
}

internal sealed class AgentStatusStream
{
    private readonly Endpoint endpoint;
    private readonly Action<int> onCount;
    private readonly Action onDisconnect;
    private readonly CancellationTokenSource cancellation = new();
    private bool stopped;

    public AgentStatusStream(Endpoint endpoint, Action<int> onCount, Action onDisconnect)
    {
        this.endpoint = endpoint;
        this.onCount = onCount;
        this.onDisconnect = onDisconnect;
    }

    public void Start() => _ = Task.Run(ReadLoop);

    public void Stop()
    {
        stopped = true;
        cancellation.Cancel();
    }

    private async Task ReadLoop()
    {
        try
        {
            using var client = new HttpClient { Timeout = Timeout.InfiniteTimeSpan };
            using var request = new HttpRequestMessage(HttpMethod.Get, endpoint.StatusStreamUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", endpoint.Token);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("text/event-stream"));
            request.Headers.CacheControl = new CacheControlHeaderValue { NoCache = true };

            using var response = await client.SendAsync(
                request,
                HttpCompletionOption.ResponseHeadersRead,
                cancellation.Token);

            if (!response.IsSuccessStatusCode)
            {
                NotifyDisconnect();
                return;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(cancellation.Token);
            using var reader = new StreamReader(stream);
            var buffer = "";

            while (!cancellation.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(cancellation.Token);
                if (line is null) break;
                if (line.Length == 0)
                {
                    Parse(buffer);
                    buffer = "";
                    continue;
                }

                buffer = buffer.Length == 0 ? line : buffer + "\n" + line;
            }
        }
        catch (OperationCanceledException)
        {
            return;
        }
        catch
        {
            NotifyDisconnect();
            return;
        }

        NotifyDisconnect();
    }

    private void Parse(string eventText)
    {
        var data = eventText
            .Split('\n')
            .FirstOrDefault(line => line.StartsWith("data: ", StringComparison.Ordinal));
        if (data is null) return;

        try
        {
            using var document = JsonDocument.Parse(data["data: ".Length..]);
            if (document.RootElement.TryGetProperty("active_agents", out var count))
            {
                onCount(count.GetInt32());
            }
        }
        catch (JsonException)
        {
        }
    }

    private void NotifyDisconnect()
    {
        if (stopped) return;
        stopped = true;
        onDisconnect();
    }
}

internal static class FlameIcons
{
    public static Icon For(int? activeAgentCount)
    {
        var level = (activeAgentCount ?? 0) switch
        {
            0 => FlameLevel.Unavailable,
            1 => FlameLevel.OneAgent,
            _ => FlameLevel.MultipleAgents,
        };

        using var bitmap = new Bitmap(32, 32);
        using var graphics = Graphics.FromImage(bitmap);
        graphics.SmoothingMode = SmoothingMode.AntiAlias;
        graphics.Clear(Color.Transparent);

        var color = level switch
        {
            FlameLevel.OneAgent => Color.FromArgb(255, 149, 0),
            FlameLevel.MultipleAgents => Color.FromArgb(10, 132, 255),
            _ => Color.FromArgb(200, 200, 200),
        };

        var flame = new PointF[]
        {
            new(16, 28), new(7, 18), new(8, 11), new(13, 4), new(16, 10),
            new(19, 3), new(24, 12), new(25, 19),
        };

        if (level == FlameLevel.Unavailable)
        {
            using var pen = new Pen(color, 2f);
            graphics.DrawClosedCurve(pen, flame);
        }
        else
        {
            using var brush = new SolidBrush(color);
            graphics.FillClosedCurve(brush, flame);
            using var inner = new SolidBrush(Color.FromArgb(230, 255, 220, 160));
            graphics.FillClosedCurve(inner, new PointF[]
            {
                new(16, 24), new(12, 18), new(16, 12), new(20, 18),
            });
        }

        if (level == FlameLevel.MultipleAgents)
        {
            using var sparkle = new SolidBrush(Color.White);
            graphics.FillPolygon(sparkle, new PointF[]
            {
                new(26, 6), new(24, 10), new(26, 14), new(28, 10),
            });
        }

        return IconFromBitmap(bitmap);
    }

    private static Icon IconFromBitmap(Bitmap bitmap)
    {
        var handle = bitmap.GetHicon();
        try
        {
            using var temp = Icon.FromHandle(handle);
            return (Icon)temp.Clone();
        }
        finally
        {
            DestroyIcon(handle);
        }
    }

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    private static extern bool DestroyIcon(IntPtr handle);
}

internal enum FlameLevel
{
    Unavailable,
    OneAgent,
    MultipleAgents,
}
