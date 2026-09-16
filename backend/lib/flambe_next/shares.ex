defmodule FlambeNext.Shares do
  @moduledoc """
  Publishes a frozen timeline snapshot to object storage and returns a public viewer URL.
  """

  @type result :: {:ok, %{id: String.t(), url: String.t()}} | {:error, atom()}

  @spec create(map()) :: result()
  def create(%{"version" => version} = snapshot) when version == 1 do
    with :ok <- validate_snapshot(snapshot),
         id <- generate_id(),
         {:ok, body} <- encode_snapshot(snapshot),
         :ok <- ensure_configured(),
         {:ok, _blob_url} <- store().put("snapshots/#{id}.json", body) do
      {:ok, %{id: id, url: "#{viewer_url()}/s/#{id}"}}
    end
  end

  def create(_), do: {:error, :invalid_snapshot}

  defp validate_snapshot(%{
         "viewport" => %{"leftBoundaryTime" => left, "rightBoundaryTime" => right},
         "fixture" => %{"events" => events, "threads" => threads}
       })
       when is_number(left) and is_number(right) and right > left and is_list(events) and
              is_list(threads) do
    :ok
  end

  defp validate_snapshot(_), do: {:error, :invalid_snapshot}

  defp encode_snapshot(snapshot) do
    {:ok, Jason.encode!(snapshot)}
  rescue
    _ -> {:error, :invalid_snapshot}
  end

  defp ensure_configured do
    if viewer_url() in [nil, ""] do
      {:error, :not_configured}
    else
      :ok
    end
  end

  defp generate_id do
    16 |> :crypto.strong_rand_bytes() |> Base.url_encode64(padding: false)
  end

  defp viewer_url do
    case Application.get_env(:flambe_next, :share_viewer_url) do
      url when is_binary(url) -> String.trim_trailing(url, "/")
      _ -> nil
    end
  end

  defp store do
    Application.get_env(:flambe_next, :share_store, FlambeNext.Shares.VercelBlob)
  end
end
