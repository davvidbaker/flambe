defmodule FlambeNext.Traces do
  import Ecto.Query

  alias Ecto.Multi
  alias FlambeNext.Accounts.User
  alias FlambeNext.Repo
  alias FlambeNext.Traces.{Thread, Trace}

  def list_traces do
    Repo.all(Trace)
  end

  def get_trace!(id) do
    Trace
    |> Repo.get!(id)
    |> Repo.preload(threads: from(thread in Thread, order_by: [asc: thread.rank, asc: thread.id]))
  end

  def get_user_trace!(%User{} = user, id) do
    Trace
    |> where([trace], trace.user_id == ^user.id and trace.id == ^id)
    |> Repo.one!()
    |> Repo.preload(threads: from(thread in Thread, order_by: [asc: thread.rank, asc: thread.id]))
  end

  def list_user_traces(%User{} = user) do
    from(trace in Trace, where: trace.user_id == ^user.id, order_by: [asc: trace.id])
    |> Repo.all()
  end

  def create_trace(%User{} = user, attrs) do
    Multi.new()
    |> Multi.insert(:trace, Trace.changeset(%Trace{user_id: user.id}, attrs))
    |> Multi.insert(:main_thread, fn %{trace: trace} ->
      Thread.changeset(%Thread{trace_id: trace.id}, %{name: "Main", rank: 0})
    end)
    |> Repo.transaction()
    |> case do
      {:ok, %{trace: trace}} -> {:ok, trace}
      {:error, _operation, changeset, _changes} -> {:error, changeset}
    end
  end

  def create_thread(%Trace{} = trace, attrs) do
    %Thread{trace_id: trace.id}
    |> Thread.changeset(attrs)
    |> Repo.insert()
  end
end
