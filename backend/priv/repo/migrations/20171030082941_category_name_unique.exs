defmodule Stitch.Repo.Migrations.CategoryNameUnique do
  use Ecto.Migration

  def change do
    create unique_index(:categories, [:name, :user_id], name: :user_category_index)
  end
end
