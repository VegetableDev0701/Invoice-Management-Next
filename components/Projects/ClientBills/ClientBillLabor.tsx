import { useMemo } from 'react';

import { LaborSummary } from '@/lib/models/summaryDataModel';
import { formatNumber } from '@/lib/utility/formatter';

import CheckboxSubTable from '@/components/Tables/SubTables/CheckboxSortHeadingsTableSub';

interface Props {
  projectId: string;
  tableData: LaborSummary | null;
}

const tableHeadings = {
  name: 'Employee Name',
  workDescription: 'Work Description',
  costCode: 'Cost Code',
  hours: 'Hours',
  rate: 'Rate ($)',
  totalAmt: 'Total ($)',
};

export default function ClientBillLabor(props: Props) {
  const { projectId, tableData } = props;

  // Normalize labor data for table
  const laborRows = useMemo(() => {
    if (tableData) {
      return Object.entries(tableData).flatMap(([key, row]) => {
        return Object.entries(row.line_items).map(([item_key, item]) => {
          return {
            name: row['name'],
            workDescription: item['work_description'],
            costCode: item['cost_code'],
            hours: item['number_of_hours'],
            rate: row['rate'],
            totalAmt: formatNumber(item['amount']),
            uuid: row['uuid'],
            rowId: key + '_' + item_key,
          };
        });
      });
    } else {
      return null;
    }
  }, [tableData]);

  return (
    <>
      <CheckboxSubTable
        headings={tableHeadings}
        rows={laborRows}
        projectId={projectId}
      />
    </>
  );
}
