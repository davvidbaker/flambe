defmodule FlambeNext.Repo.Migrations.CreateReconciliationReceipts do
  use Ecto.Migration

  def change do
    create table(:reconciliation_receipts, primary_key: false) do
      add :trace_id, references(:traces, on_delete: :delete_all), primary_key: true
      add :agent_id, :text, primary_key: true
      add :repair_id, :text, primary_key: true
      add :request_hash, :text, null: false
      add :receipt, :map, null: false
    end
  end
end
