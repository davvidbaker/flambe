defmodule Stitch.Repo.Migrations.CreateSearchTerms do
  use Ecto.Migration

  def change do
    create table(:search_terms) do
      add(:term, :string)
      add(:timestamp, :utc_datetime)
      add(:user_id, references(:users, on_delete: :nothing))

      timestamps()
    end

    create(index(:search_terms, [:user_id]))
  end
end
