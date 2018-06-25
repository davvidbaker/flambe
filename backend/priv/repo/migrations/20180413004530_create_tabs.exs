defmodule Steady.Repo.Migrations.CreateTabs do
  use Ecto.Migration

  def change do
    create table(:tabs) do
      add(:count, :integer)
      add(:user_id, references(:users, on_delete: :nothing))

      timestamps()
    end

    create(index(:tabs, [:user_id]))
  end
end
