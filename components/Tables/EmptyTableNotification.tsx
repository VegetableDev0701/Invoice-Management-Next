import { EMPTY_TABLE_TEXT } from '@/lib/globals';

export type TableType =
  | 'contracts'
  | 'invoices'
  | 'laborFee'
  | 'noChangeOrdersSelected'
  | 'noChangeOrders'
  | 'vendors'
  | 'projects'
  | 'expiredLicenseVendors'
  | 'completedProjects'
  | undefined;

interface Props {
  tableType: TableType;
}

export default function EmptyTableNotification(props: Props) {
  const { tableType } = props;

  return (
    <>
      {
        <div className="absolute inset-0 flex justify-center items-center bg-transparent">
          <span className="text-black text-4xl opacity-40 mb-10">
            {tableType ? EMPTY_TABLE_TEXT[tableType] : ''}
          </span>
        </div>
      }
    </>
  );
}
