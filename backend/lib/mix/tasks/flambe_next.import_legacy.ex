defmodule Mix.Tasks.FlambeNext.ImportLegacy do
  use Mix.Task

  alias FlambeNext.Repo

  @shortdoc "Imports a restored legacy Flambe database into flambe_next"

  @tables [
    {"users", ~w(id name username inserted_at updated_at)},
    {"credentials", ~w(id email password_hash user_id inserted_at updated_at)},
    {"traces", ~w(id name user_id inserted_at updated_at)},
    {"threads", ~w(id name rank trace_id inserted_at updated_at)},
    {"activities", ~w(id name description weight thread_id inserted_at updated_at)},
    {"events", ~w(id timestamp phase message trace_id activity_id inserted_at updated_at)},
    {"categories", ~w(id name color_background color_text user_id inserted_at updated_at)},
    {"activities_categories", ~w(activity_id category_id)},
    {"mantras", ~w(id name timestamp user_id inserted_at updated_at)},
    {"attentions", ~w(id thread_id timestamp user_id inserted_at updated_at)},
    {"tabs", ~w(id count window_count timestamp user_id inserted_at updated_at)},
    {"search_terms", ~w(id term timestamp user_id inserted_at updated_at)}
  ]

  @id_tables Enum.map(@tables, fn {table, columns} -> if "id" in columns, do: table end)
             |> Enum.reject(&is_nil/1)

  @impl Mix.Task
  def run(args) do
    Mix.Task.run("app.start")

    {options, _arguments, invalid} =
      OptionParser.parse(args, strict: [source: :string, replace: :boolean, dry_run: :boolean])

    if invalid != [] do
      Mix.raise("Unknown options: #{Enum.map_join(invalid, ", ", &elem(&1, 0))}")
    end

    source_database =
      options[:source] || System.get_env("LEGACY_DATABASE") || "flambe_legacy_restored"

    source = connect_to_source!(source_database)

    rows_by_table =
      Map.new(@tables, fn {table, columns} -> {table, source_rows(source, table, columns)} end)

    report_counts(source_database, rows_by_table)

    if options[:dry_run] do
      :ok
    else
      import!(rows_by_table, options[:replace])
    end
  end

  defp connect_to_source!(database) do
    {:ok, source} =
      Postgrex.start_link(
        hostname: System.get_env("LEGACY_DB_HOST") || "localhost",
        username: System.get_env("LEGACY_DB_USER") || "postgres",
        password: System.get_env("LEGACY_DB_PASSWORD") || "postgres",
        database: database
      )

    source
  end

  defp source_rows(source, "credentials", columns) do
    query_rows(source, "credentials", columns, "WHERE email <> '' AND password_hash IS NOT NULL")
  end

  defp source_rows(source, table, columns), do: query_rows(source, table, columns, "")

  defp query_rows(source, table, columns, where_clause) do
    column_list = Enum.join(columns, ", ")

    %Postgrex.Result{columns: result_columns, rows: rows} =
      Postgrex.query!(
        source,
        "SELECT #{column_list} FROM #{table} #{where_clause} ORDER BY #{List.first(columns)}"
      )

    Enum.map(rows, fn row -> Map.new(Enum.zip(result_columns, row)) end)
  end

  defp report_counts(source_database, rows_by_table) do
    summary =
      rows_by_table
      |> Enum.map_join(", ", fn {table, rows} -> "#{table}=#{length(rows)}" end)

    Mix.shell().info("Legacy source #{source_database}: #{summary}")
  end

  defp import!(rows_by_table, true) do
    Repo.transaction(
      fn ->
        Repo.query!("TRUNCATE TABLE users RESTART IDENTITY CASCADE", [], log: false)
        insert_rows!(rows_by_table)
      end,
      log: false
    )

    Mix.shell().info("Imported legacy data into #{Repo.config()[:database]}.")
  end

  defp import!(_rows_by_table, false) do
    Mix.raise("Refusing to modify the next database without --replace. Run with --dry-run first.")
  end

  defp insert_rows!(rows_by_table) do
    Enum.each(@tables, fn {table, _columns} ->
      case Map.fetch!(rows_by_table, table) do
        [] -> :ok
        rows -> Repo.insert_all(table, rows, log: false)
      end
    end)

    Enum.each(@id_tables, &reset_sequence!/1)
  end

  defp reset_sequence!(table) do
    Repo.query!(
      "SELECT setval(pg_get_serial_sequence('#{table}', 'id'), COALESCE((SELECT MAX(id) FROM #{table}), 1), true)",
      [],
      log: false
    )
  end
end
