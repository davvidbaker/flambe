defmodule Flambe.Repo.Migrations.CreateActivities do
  use Ecto.Migration

  def change do
    create table(:activities) do
      add(:name, :string)
      add(:description, :string)

      timestamps()
    end

    alter table(:events) do
      add(:activity_id, references(:activities, on_delete: :delete_all), null: true)
    end
  end
end
