# Internal events
Internal events creates a mechanism for modules to provide information about each other, as well as elicit action from subscribers.  Internal events are typically used to create a 'pipeline' of actions that refresh data from a remote source, or render changes to the rows of the grid.  Event subscriptions can be prioritized in a manner so that each subscriber's action is executed in a distinct order.  There are two event distinct event pipelines that are utilized: Publisher and Subscriber, and Data Pipeline.

## Publisher and Subscriber
Publisher and subscriber events are intended to perform actions on the grid as the result of initial setup and/or user interaction.  The list of defined events are: 
- render: Called when table rows are ready to be rendered, or re-rendered due to the grid's data source being updated.
- remoteParams: Called when wanting to build a parameter query string from any modules that hold a parameter value.
- postInitMod: Called after all registered modules have been instantiate initialized.

### render event
A few of the core modules that are subscribed to the **render** event require a specific priority order.  The order of these modules should considered before registering any additional items.  Changing the order could introduce adverse effects to the grid when utilizing local data processing.

| Module | Type | Priority | Description |
| --------- | ---- | ---- | ----------- |
| `FilterModule` | subscriber | 8 | Enables filtering of data.  Order is important if grid will use local data processing. |
| `SortModule` | subscriber | 9 | Enables sorting of data.  Order is important if grid will use local data processing |
| `RowModule` | subscriber| 10 | Manages the rendering of rows.  Added when paging is turned off. |
| `PagerModule` | subscriber | 10 | Manages the rendering of rows and pager control.  Replaces `RowModule` when paging is enabled. |
| `RowCountModule` | subscriber | 20 | Will apply row count to target label after all data manipulation has completed. |
| `ElementMultiSelect` | publisher |  | Renders grid with updated filter inputs. |

## remoteParams event
Takes the result of each subscriber's callback function and chains them into one result.
| Module   | Type | Description |
| --------- | ----|----------- |
| `FilterModule` | subscriber | Compiles filter inputs and concatenates results with input parameter. |
| `SortModule`   | subscriber | Compiles sort column and direction and concatenates results with input parameter. |
| `RowModule` | consumer | Compiles parameter inputs from registered modules for remote processing. |
| `PagerModule` | consumer | Compiles parameter inputs from registered modules for remote processing. |

## Data Pipeline
Data Pipeline class is responsible for executing a series of pre-registered steps that need to retrieve data from a remote source, and execute a callback function with the results.  Steps are executed in order that have been registered within the `dataPipeline` class.  There are two named step events already present in the application:
- init: Retrieves data during some initialization phase.
- refresh:  Retrieves data after some user interaction or input with the grid.

To register a custom event of your own, use the `context.pipeline.addStep()` method in the `GridContext` class.  More than one callback event can be registered to the same event name.  The method will skip adding the step if a duplicate/matching event name and callback function has already been registered.

### Pipeline subscribers
| Class | Subscription  | Description |
| --------- | ---- | ----------- |
| `ElementSelect` | init | Retrieves select list options from remote source when `filterValues` is set with string URL. |
| `ElementMultiSelect` | init | Retrieves select list options from remote source when `filterValues` is set with string URL. |
| `GridCore` | init | Retrieves grid data from remote server if setting `remoteProcessing` is true. |
| `RefreshModule` | refresh | Retrieves select list options from remote source. |