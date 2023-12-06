import React, { createElement } from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import { ReportDataItem } from '@/lib/models/budgetCostCodeModel';

export interface Props {
  billTitle: string;
  reportData: ReportDataItem[];
}

const B2AReport = ({ reportData, billTitle }: Props) => {
  return (
    <Document>
      <Page
        style={{
          paddingTop: 45,
          paddingBottom: 55,
          paddingHorizontal: 35,
          fontFamily: 'Times-Roman',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            textAlign: 'center',
          }}
        >
          {billTitle}
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            textAlign: 'center',
            padding: `2px 0 4px 0`,
            gap: 10,
            fontSize: 12,
            fontWeight: 'black',
            borderBottom: '2px solid black',
            marginTop: 10,
            marginBottom: 3,
          }}
          fixed
        >
          <Text style={{ flex: '1 1 0' }}>Service</Text>
          <Text style={{ width: '60px' }}>Budget</Text>
          <Text style={{ width: '60px', fontSize: 11 }}>Actual Costs</Text>
          <Text style={{ width: '60px' }}>Difference</Text>
          <Text style={{ width: '50px' }}>%</Text>
        </View>
        {reportData.map((data, index) => (
          <View
            key={index}
            style={{
              display: 'flex',
              flexDirection: 'row',
              width: '100%',
              textAlign: 'justify',
              padding: `2px 0 2px ${7 * (data.depth || 0)}px`,
              gap: 15,
              fontSize: 12,
            }}
          >
            <Text style={{ flex: '1 1 0' }}>{data.title}</Text>
            <Text style={{ width: '60px', textAlign: 'right' }}>
              {data.budgetAmount}
            </Text>
            <Text style={{ width: '60px', textAlign: 'right' }}>
              {data.actualAmount}
            </Text>
            <Text style={{ width: '60px', textAlign: 'right' }}>
              {data.difference}
            </Text>
            <Text style={{ width: '50px', textAlign: 'right' }}>
              {data.percent}
            </Text>
          </View>
        ))}
        <Text
          style={{
            position: 'absolute',
            fontSize: 12,
            bottom: 30,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'grey',
          }}
          render={({
            pageNumber,
            totalPages,
          }: {
            pageNumber: number;
            totalPages: number;
          }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  );
};

export const renderPDF = async (props: Props) => {
  const { pdf } = await import('@react-pdf/renderer');
  // TODO
  // eslint-disable-next-line
  // @ts-ignore
  return pdf(createElement(B2AReport, props)).toBlob();
};

export default B2AReport;
