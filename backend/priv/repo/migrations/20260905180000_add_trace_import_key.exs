defmodule FlambeNext.Repo.Migrations.AddTraceImportKey do
  use Ecto.Migration

  def change do
    alter table(:traces) do
      add :import_key, :string
    end

    create unique_index(:traces, [:user_id, :import_key],
             name: :traces_user_id_import_key_index,
             where: "import_key IS NOT NULL"
           )
  end
end
