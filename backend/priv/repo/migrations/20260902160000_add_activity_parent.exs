defmodule FlambeNext.Repo.Migrations.AddActivityParent do
  use Ecto.Migration

  def change do
    alter table(:activities) do
      add :parent_id, references(:activities, on_delete: :nilify_all)
    end

    create index(:activities, [:parent_id])
  end
end
