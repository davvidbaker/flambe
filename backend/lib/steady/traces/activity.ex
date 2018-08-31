defmodule Flambe.Traces.Activity do
  use Ecto.Schema
  import Ecto.Changeset
  import Ecto.Query
  alias Flambe.Traces.{Activity, Event, Thread}
  alias Flambe.Accounts.{Category}

  schema "activities" do
    field(:description, :string)
    field(:name, :string)
    field(:weight, :integer)
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
    |> Flambe.Repo.preload(:categories)
    |> cast(attrs, [:name, :description, :weight])
    |> validate_required([:name])
    # ⚠️ really not sure if this is the right way to do this..., it is working though...👇 not.
    # I think I might have figured it out 🤩
    # I think put_assoc is what I need to use when the activity is being created, and cast assoc at other times. Does that make sense? Why would I need to do that?
    |> maybe_upsert_categories(attrs)

    # |> cast_assoc(:categories, with: &Category.changeset/2)
  end

  # ⚠️ be more consistent about sending down "category_ids" or "categories"
  defp maybe_upsert_categories(changeset, %{"category_ids" => _category_ids} = attrs) do
    put_assoc(changeset, :categories, upsert_categories(attrs))
  end

  defp maybe_upsert_categories(changeset, %{"categories" => _categories} = attrs) do
    put_assoc(changeset, :categories, upsert_categories(attrs))
  end

  defp maybe_upsert_categories(changeset, _attrs) do
    changeset
  end

  defp upsert_categories(attrs) do
    (attrs["categories"] || attrs["category_ids"] || [])
    |> insert_and_get_all()
  end

  defp insert_and_get_all([]) do
    []
  end

  defp insert_and_get_all(categories) do
    Flambe.Repo.all(from(c in Flambe.Accounts.Category, where: c.id in ^categories))
  end
end
