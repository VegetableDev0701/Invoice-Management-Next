// import InputTableDropdown from '@/components/Inputs/InputTableDropdown';
// import { Invoices } from '@/lib/models/summaryDataModel';
// import {
//   useAppDispatch as useDispatch,
//   useAppSelector as useSelector,
// } from '@/store/hooks';
// import { invoiceActions } from '@/store/invoice-slice';
// import { useMemo } from 'react';

// interface Props {
//   sortKey: string;
//   sortOrder: 'asc' | 'desc';
// }

// const InvoiceRow = (props: Props) => {
//   const { sortKey, sortOrder, dropdown } = props;
//   const dispatch = useDispatch();
//   const filteredData = useSelector((state) => state.invoice.filteredData);

//   const invoiceRowClickHandler = (invoice: Invoices) => {
//     dispatch(
//       invoiceActions.setClickedInvoice({ invoice: invoice, isRowClicked: true })
//     );
//   };

//   const filteredSortedData = useMemo(() => {
//     if (sortKey === null) {
//       return filteredData;
//     }
//     return [...filteredData].sort((a, b) => {
//       if (sortKey.endsWith('amount')) {
//         return sortOrder === 'asc'
//           ? (+(a[sortKey] as string).replace(/\D/g, '') as number) -
//               (+(b[sortKey] as string).replace(/\D/g, '') as number)
//           : (+(b[sortKey] as string).replace(/\D/g, '') as number) -
//               (+(a[sortKey] as string).replace(/\D/g, '') as number);
//       }

//       if (sortKey.includes('Date')) {
//         return sortOrder === 'asc'
//           ? new Date(a[sortKey] as string).valueOf() -
//               new Date(b[sortKey] as string).valueOf()
//           : new Date(b[sortKey] as string).valueOf() -
//               new Date(a[sortKey] as string).valueOf();
//       }

//       if (typeof a[sortKey] === 'number' && typeof b[sortKey] === 'number') {
//         return sortOrder === 'asc'
//           ? (a[sortKey] as number) - (b[sortKey] as number)
//           : (b[sortKey] as number) - (a[sortKey] as number);
//       } else {
//         return sortOrder === 'asc'
//           ? String(a[sortKey]).localeCompare(String(b[sortKey]))
//           : String(b[sortKey]).localeCompare(String(a[sortKey]));
//       }
//     });
//   }, [filteredData.length, sortKey, sortOrder]);

//   return (
//     <>
//       {filteredSortedData.map((invoice) => {
//         return (
//           <tr
//             key={invoice['doc_id'] as string}
//             onClick={() => {
//               invoiceRowClickHandler(invoice);
//             }}
//             className={`hover:bg-slate-50 hover:cursor-pointer m-0 ${
//               selected.includes(invoice) ? 'bg-slate-50' : ''
//             }`}
//           >
//             <td
//               onClick={stopPropClickHandler}
//               className="relative border-b border-gray-300 px-7 sm:w-12 sm:px-6"
//             >
//               {selected.includes(invoice) && (
//                 <div
//                   onClick={stopPropClickHandler}
//                   className="absolute inset-y-0 left-0 w-0.5 bg-stak-dark-green"
//                 />
//               )}
//               <input
//                 type="checkbox"
//                 className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-stak-dark-green focus:ring-0 focus:ring-offset-0"
//                 value={invoice.uuid as string}
//                 checked={selected.includes(invoice)}
//                 onClick={stopPropClickHandler}
//                 onChange={(e) =>
//                   setSelected(
//                     e.target.checked
//                       ? [...selected, invoice]
//                       : selected.filter((el) => el !== invoice)
//                   )
//                 }
//               />
//             </td>
//             {Object.keys(headings).map((headingsKey, j) => {
//               return (
//                 <td
//                   key={`${headingsKey}_${j}`}
//                   className={classNames(
//                     j === 0
//                       ? firstColClasses
//                       : j === rows.length - 1
//                       ? lastColClasses
//                       : middleColClasses,
//                     commonColClasses,
//                     checkExpirationDate(headingsKey, invoice)
//                       ? 'text-red-500'
//                       : ''
//                   )}
//                 >
//                   {headingsKey === 'project' && dropdown && (
//                     <div
//                       onClick={stopPropClickHandler}
//                       className="min-w-[8rem]"
//                     >
//                       <InputTableDropdown
//                         input={dropdown}
//                         invoiceId={invoice.doc_id}
//                         sortBy={dropdown.sortBy}
//                       />
//                     </div>
//                   )}
//                   {headingsKey !== 'project' && (
//                     <div className="block h-full w-full">
//                       {headingsKey.endsWith('Amt')
//                         ? formatNumber(invoice[headingsKey] as string)
//                         : headingsKey.endsWith('Phone')
//                         ? formatPhoneNumber(invoice[headingsKey] as string)
//                         : invoice[headingsKey]}
//                     </div>
//                   )}
//                 </td>
//               );
//             })}
//           </tr>
//         );
//       })}
//     </>
//   );
// };

// export default InvoiceRow;
