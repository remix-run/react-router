import { CreateHistory, HistoryBasename, HistoryBasenameOptions, HistoryQueries } from 'history'

export default function useRouterHistory<O, H>(createHistory: CreateHistory<O, H>): CreateHistory<O & HistoryBasenameOptions, H & HistoryBasename & HistoryQueries>
