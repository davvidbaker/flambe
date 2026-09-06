defmodule FlambeNext.BuildInfo do
  @moduledoc false

  @unknown "unknown"

  def git_sha do
    Application.get_env(:flambe_next, :git_sha, @unknown)
  end

  def detect_git_sha do
    env_sha() || git_rev_parse() || @unknown
  end

  defp env_sha do
    case System.get_env("GIT_SHA") do
      sha when is_binary(sha) ->
        trimmed = String.trim(sha)
        if trimmed == "", do: nil, else: trimmed

      _ ->
        nil
    end
  end

  defp git_rev_parse do
    repo =
      cond do
        File.dir?(".git") -> "."
        File.dir?("../.git") -> ".."
        true -> nil
      end

    if is_nil(repo) do
      nil
    else
      case System.cmd("git", ["-C", repo, "rev-parse", "HEAD"], stderr_to_stdout: true) do
        {out, 0} ->
          sha = String.trim(out)
          if sha == "", do: nil, else: sha

        _ ->
          nil
      end
    end
  end
end
