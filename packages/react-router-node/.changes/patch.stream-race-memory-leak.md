Fix a memory leak in `writeReadableStreamToWritable` and `writeAsyncIterableToWritable` that retained memory for the lifetime of a long-running stream
