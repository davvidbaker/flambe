defmodule Stitch.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query
  alias Stitch.Traces.{Activity, Event, Thread}
  alias Stitch.Accounts.{Category}

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
    |> Stitch.Repo.preload(:categories)
    |> cast(attrs, [:name, :description])
    |> validate_required([:name])
    # ⚠️ really not sure if this is the right way to do this..., it is working though...👇
    |> put_assoc(:categories, upsert_categories(attrs))
  end

  defp upsert_categories(attrs) do
    (attrs["categories"] || attrs["category_ids"] || [])
    |> insert_and_get_all()
  end

  defp insert_and_get_all([]) do
    []
  end

  defp insert_and_get_all(categories) do
    Stitch.Repo.all(from(c in Stitch.Accounts.Category, where: c.id in ^categories))
  end
end
