defmodule Stitch.Repo.Migrations.CreateCategories do
  use Ecto.Migration

  def change do
    create table(:categories) do
      add :name, :string
      add :color, :string
      add :user_id, references(:users)

      timestamps()
    end

    create unique_index(:categories, [:name, :user_id], name: :user_category_index)
  end
end
