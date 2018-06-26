defmodule Steady.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query
  alias Steady.Traces.{Activity, Event, Thread}
  alias Steady.Accounts.{Category}

  schema "activities" do
    field(:description, :string)
    field(:name, :string)
    has_many(:events, Event)
    belongs_to(:thread, Thread)

    # see https://hexdocs.pm/ecto/Ecto.Schema.html#many_to_many/3-removing-data for explanation on deleting many_to_many associations
    many_to_many(
      :categories,
      Category,
      join_through: "activities_categories",
      on_delete: :delete_all
    )

    timestamps()
  end

  @doc false
  def changeset(%Activity{} = activity, attrs) do
    activity
    |> Steady.Repo.preload(:categories)
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
    # ⚠️ really not sure if this is the right way to do this..., it is working though...👇 not.
    # I think I might have figured it out 🤩
    # I think put_assoc is what I need to use when the activity is being created, and cast assoc at other times. Does that make sense? Why would I need to do that?
    |> put_assoc(:categories, upsert_categories(attrs))
    # |> cast_assoc(:categories, with: &Category.changeset/2)
  end

  defp upsert_categories(attrs) do
    (attrs["categories"] || attrs["category_ids"] || [])
    |> insert_and_get_all()
  end

  defp insert_and_get_all([]) do
    []
  end

  defp insert_and_get_all(categories) do
    Steady.Repo.all(from(c in Steady.Accounts.Category, where: c.id in ^categories))
  end
end
