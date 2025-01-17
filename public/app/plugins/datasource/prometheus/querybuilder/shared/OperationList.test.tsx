import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OperationList } from './OperationList';
import { promQueryModeller } from '../PromQueryModeller';
import { EmptyLanguageProviderMock } from '../../language_provider.mock';
import PromQlLanguageProvider from '../../language_provider';
import { PromVisualQuery } from '../types';
import { PrometheusDatasource } from '../../datasource';
import { DataSourceApi } from '@grafana/data';

const defaultQuery: PromVisualQuery = {
  metric: 'random_metric',
  labels: [{ label: 'instance', op: '=', value: 'localhost:9090' }],
  operations: [
    {
      id: 'rate',
      params: ['auto'],
    },
    {
      id: '__sum_by',
      params: ['instance', 'job'],
    },
  ],
};

describe('OperationList', () => {
  it('renders operations', async () => {
    setup();
    expect(screen.getByText('Rate')).toBeInTheDocument();
    expect(screen.getByText('Sum by')).toBeInTheDocument();
  });

  it('removes an operation', async () => {
    const { onChange } = setup();
    const removeOperationButtons = screen.getAllByTitle('Remove operation');
    expect(removeOperationButtons).toHaveLength(2);
    userEvent.click(removeOperationButtons[1]);
    expect(onChange).toBeCalledWith({
      labels: [{ label: 'instance', op: '=', value: 'localhost:9090' }],
      metric: 'random_metric',
      operations: [{ id: 'rate', params: ['auto'] }],
    });
  });

  it('adds an operation', async () => {
    const { onChange } = setup();
    addOperation('Aggregations', 'Min');
    expect(onChange).toBeCalledWith({
      labels: [{ label: 'instance', op: '=', value: 'localhost:9090' }],
      metric: 'random_metric',
      operations: [
        { id: 'rate', params: ['auto'] },
        { id: '__sum_by', params: ['instance', 'job'] },
        { id: 'min', params: [] },
      ],
    });
  });
});

function setup(query: PromVisualQuery = defaultQuery) {
  const languageProvider = (new EmptyLanguageProviderMock() as unknown) as PromQlLanguageProvider;
  const props = {
    datasource: new PrometheusDatasource(
      {
        url: '',
        jsonData: {},
        meta: {} as any,
      } as any,
      undefined,
      undefined,
      languageProvider
    ) as DataSourceApi,
    onRunQuery: () => {},
    onChange: jest.fn(),
    queryModeller: promQueryModeller,
  };

  render(<OperationList {...props} query={query} />);
  return props;
}

function addOperation(section: string, op: string) {
  const addOperationButton = screen.getByTitle('Add operation');
  expect(addOperationButton).toBeInTheDocument();
  userEvent.click(addOperationButton);
  const sectionItem = screen.getByTitle(section);
  expect(sectionItem).toBeInTheDocument();
  // Weirdly the userEvent.click doesn't work here, it reports the item has pointer-events: none. Don't see that
  // anywhere when debugging so not sure what style is it picking up.
  fireEvent.click(sectionItem.children[0]);
  const opItem = screen.getByTitle(op);
  expect(opItem).toBeInTheDocument();
  fireEvent.click(opItem);
}
