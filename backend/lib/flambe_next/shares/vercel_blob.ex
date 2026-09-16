defmodule FlambeNext.Shares.VercelBlob do
  @moduledoc false

  @blob_host "https://blob.vercel-storage.com/"

  def put(pathname, body) when is_binary(pathname) and is_binary(body) do
    token = Application.get_env(:flambe_next, :vercel_blob_token)

    if token in [nil, ""] do
      {:error, :not_configured}
    else
      upload(pathname, body, token)
    end
  end

  defp upload(pathname, body, token) do
    url = @blob_host <> String.trim_leading(pathname, "/")

    case Req.put(url,
           headers: [
             {"authorization", "Bearer #{token}"},
             {"x-api-version", "7"},
             {"x-content-type", "application/json"},
             {"x-add-random-suffix", "0"}
           ],
           body: body
         ) do
      {:ok, %{status: status, body: response}} when status in 200..299 ->
        case blob_url(response) do
          nil -> {:error, :upload_failed}
          public_url -> {:ok, public_url}
        end

      {:ok, _} ->
        {:error, :upload_failed}

      {:error, _} ->
        {:error, :upload_failed}
    end
  end

  defp blob_url(%{"url" => url}) when is_binary(url), do: url
  defp blob_url(%{"downloadUrl" => url}) when is_binary(url), do: url
  defp blob_url(_), do: nil
end
