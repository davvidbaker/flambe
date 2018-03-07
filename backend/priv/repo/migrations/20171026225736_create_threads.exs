defmodule Stitch.Repo.Migrations.CreateThreads do
  use Ecto.Migration

  def change do
    create table(:threads) do
      add :name, :string
      add :rank, :integer
      add :trace_id, references(:traces, on_delete: :delete_all), null: false
      

      timestamps()
    end

    create index(:threads, [:trace_id])
  end
end
