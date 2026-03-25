import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Colors } from '../../theme/color';
import { ChevronRight } from 'lucide-react-native';

interface TableDataRow {
  id: string;
  [key: string]: string | number;
}

interface TableColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: TableDataRow) => React.ReactNode;
}

interface DataTableProps {
  title: string;
  columns: TableColumn[];
  data: TableDataRow[];
  onRowPress?: (row: TableDataRow) => void;
  showRowNumbers?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  title,
  columns,
  data = [],
  onRowPress,
  showRowNumbers = false,
}) => {
  const renderCell = (value: any, column: TableColumn, row: TableDataRow) => {
    if (column.render) {
      return column.render(value, row);
    }

    if (typeof value === 'number') {
      return value.toLocaleString();
    }

    return String(value);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.rowCount}>{data.length} records</Text>
      </View>

      {data.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header Row */}
            <View style={styles.tableHeader}>
              {showRowNumbers && (
                <View style={[styles.cell, styles.rowNumberCell]}>
                  <Text style={[styles.headerText, styles.rowNumberText]}>#</Text>
                </View>
              )}
              {columns.map((column) => (
                <View
                  key={column.key}
                  style={[
                    styles.cell,
                    { width: column.width || 100 },
                  ]}
                >
                  <Text
                    style={[
                      styles.headerText,
                      column.align && { textAlign: column.align },
                    ]}
                  >
                    {column.label}
                  </Text>
                </View>
              ))}
            </View>

            {/* Data Rows */}
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.tableRow,
                    index % 2 === 0 && styles.alternateRow,
                  ]}
                  onPress={() => onRowPress?.(item)}
                  activeOpacity={0.7}
                >
                  {showRowNumbers && (
                    <View style={[styles.cell, styles.rowNumberCell]}>
                      <Text style={styles.rowNumberText}>{index + 1}</Text>
                    </View>
                  )}
                  {columns.map((column) => (
                    <View
                      key={`${item.id}-${column.key}`}
                      style={[
                        styles.cell,
                        { width: column.width || 100 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.cellText,
                          column.align && { textAlign: column.align },
                        ]}
                        numberOfLines={1}
                      >
                        {renderCell(item[column.key], column, item)}
                      </Text>
                    </View>
                  ))}
                </TouchableOpacity>
              )}
            />
          </View>
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rowCount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 2,
    borderBottomColor: '#e0e0e0',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 0,
  },
  alternateRow: {
    backgroundColor: '#fafafa',
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  rowNumberCell: {
    width: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
  },
  rowNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  emptyState: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
