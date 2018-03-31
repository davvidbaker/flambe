defmodule Stitch.Repo.Migrations.CreateMantras do
  use Ecto.Migration

  def change do
    create table(:mantras) do
      add :name, :string
      add :user_id, references(:users, on_delete: :delete_all)

      timestamps()
    end

    create index(:mantras, [:user_id])
  end
end
