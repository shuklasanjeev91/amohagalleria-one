import type { ReactNode } from 'react'
import { Platform, TextInput } from 'react-native'
import { Text, XStack, YStack } from 'tamagui'
import { GButton, GEmpty, GListRow } from '~/components/gallery/GControls'

export type AdminDataGridColumn<T> = {
  key: string
  header: string
  width?: string
  /** Prefer for native/list mode when set; falls back to render */
  listPrimary?: boolean
  listMeta?: boolean
  listStatus?: boolean
  listThumb?: boolean
  listHide?: boolean
  render: (row: T) => ReactNode
}

type AdminDataGridProps<T> = {
  title: string
  rows: T[]
  columns: AdminDataGridColumn<T>[]
  getRowId: (row: T) => string
  loading?: boolean
  emptyLabel?: string
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  addLabel?: string
  onAdd?: () => void
  toolbarExtra?: ReactNode
  /** Force list layout (native default). Web uses table unless forceList. */
  forceList?: boolean
}

function Toolbar({
  title,
  count,
  search,
  onSearchChange,
  searchPlaceholder,
  addLabel,
  onAdd,
  toolbarExtra,
}: {
  title: string
  count: number
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  addLabel?: string
  onAdd?: () => void
  toolbarExtra?: ReactNode
}) {
  if (Platform.OS === 'web') {
    return (
      <div className="g-admin-grid__toolbar">
        <div className="g-admin-grid__toolbar-left">
          <h3 className="g-admin-grid__title">{title}</h3>
          <span className="g-admin-grid__count">{count}</span>
        </div>
        <div className="g-admin-grid__toolbar-right">
          {onSearchChange ? (
            <input
              className="g-admin-grid__search"
              type="search"
              value={search || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search"
            />
          ) : null}
          {toolbarExtra}
          {onAdd ? (
            <button type="button" className="g-auth-submit g-admin-grid__add" onClick={onAdd}>
              <span>{addLabel}</span>
              <span className="g-arrow-icon" aria-hidden>
                +
              </span>
            </button>
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <YStack gap="$3" marginBottom="$4" width="100%">
      <XStack alignItems="center" justifyContent="space-between" gap="$3">
        <XStack alignItems="center" gap="$2">
          <Text fontFamily="$heading" fontSize={22} color="$color">
            {title}
          </Text>
          <Text fontSize={13} color="$color11">
            {count}
          </Text>
        </XStack>
        {onAdd ? <GButton onPress={onAdd}>{addLabel || 'Add'}</GButton> : null}
      </XStack>
      {onSearchChange ? (
        <TextInput
          value={search || ''}
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          placeholderTextColor="#6f6860"
          style={{
            borderWidth: 1,
            borderColor: '#ddd6cb',
            backgroundColor: 'rgba(255,253,249,0.9)',
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: '#141210',
          }}
        />
      ) : null}
      {toolbarExtra}
    </YStack>
  )
}

/** List-first admin table: toolbar (search + add) then dense data grid or stacked rows. */
export function AdminDataGrid<T>({
  title,
  rows,
  columns,
  getRowId,
  loading,
  emptyLabel = 'No records yet.',
  search,
  onSearchChange,
  searchPlaceholder = 'Search…',
  addLabel = 'Add',
  onAdd,
  toolbarExtra,
  forceList,
}: AdminDataGridProps<T>) {
  const useList = forceList || Platform.OS !== 'web'
  const dataCols = columns.filter((c) => !c.listHide)
  const thumbCol = dataCols.find((c) => c.listThumb)
  const primaryCol = dataCols.find((c) => c.listPrimary) || dataCols.find((c) => !c.listThumb && !c.listStatus && c.key !== 'actions')
  const metaCol = dataCols.find((c) => c.listMeta)
  const statusCol = dataCols.find((c) => c.listStatus)
  const actionCol = dataCols.find((c) => c.key === 'actions')

  if (useList) {
    return (
      <YStack width="100%" marginBottom="$6">
        <Toolbar
          title={title}
          count={rows.length}
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          addLabel={addLabel}
          onAdd={onAdd}
          toolbarExtra={toolbarExtra}
        />
        {loading ? <GEmpty>Loading…</GEmpty> : null}
        {!loading && !rows.length ? <GEmpty>{emptyLabel}</GEmpty> : null}
        {!loading
          ? rows.map((row) => (
              <GListRow
                key={getRowId(row)}
                thumb={thumbCol ? thumbCol.render(row) : undefined}
                title={primaryCol ? primaryCol.render(row) : getRowId(row)}
                meta={metaCol ? metaCol.render(row) : undefined}
                status={statusCol ? statusCol.render(row) : undefined}
                actions={actionCol ? actionCol.render(row) : undefined}
              />
            ))
          : null}
      </YStack>
    )
  }

  return (
    <div className="g-admin-grid">
      <Toolbar
        title={title}
        count={rows.length}
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder={searchPlaceholder}
        addLabel={addLabel}
        onAdd={onAdd}
        toolbarExtra={toolbarExtra}
      />

      <div className="g-studio-table-wrap g-admin-grid__table-wrap">
        <table className="g-studio-table g-admin-grid__table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="g-admin-grid__empty">
                  Loading…
                </td>
              </tr>
            ) : null}
            {!loading && !rows.length ? (
              <tr>
                <td colSpan={columns.length} className="g-admin-grid__empty">
                  {emptyLabel}
                </td>
              </tr>
            ) : null}
            {!loading
              ? rows.map((row) => (
                  <tr key={getRowId(row)}>
                    {columns.map((col) => (
                      <td key={col.key}>{col.render(row)}</td>
                    ))}
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
