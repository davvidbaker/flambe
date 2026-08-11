defmodule FlambeNext.Repo.Migrations.AddCategories do
  use Ecto.Migration

  def change do
    create table(:categories) do
      add :name, :string, null: false
      add :color_background, :string, null: false
      add :color_text, :string
      add :user_id, references(:users, on_delete: :delete_all), null: false

      timestamps(type: :utc_datetime)
    end

    create unique_index(:categories, [:user_id, :name])

    create table(:activities_categories, primary_key: false) do
      add :activity_id, references(:activities, on_delete: :delete_all), null: false
      add :category_id, references(:categories, on_delete: :delete_all), null: false
    end

    create unique_index(:activities_categories, [:activity_id, :category_id])
  end
end
