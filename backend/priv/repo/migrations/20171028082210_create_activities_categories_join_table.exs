defmodule Stitch.Repo.Migrations.CreateActivitiesCategoriesJoinTable do
  use Ecto.Migration

  def change do
    create table(:activities_categories, primary_key: false) do
      add :activity_id, references(:activities)
      add :category_id, references(:categories)
    end
    
  end
end
