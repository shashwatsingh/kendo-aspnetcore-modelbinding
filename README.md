# Kendo UI DataSourceRequest Model Binding Issue

## Running locally
nuget.config picks credentials like this, so ensure these variables are populated.

```
<packageSourceCredentials>
    <telerik>
      <add key="Username" value="%TELERIK_USER%" />
      <add key="ClearTextPassword" value="%TELERIK_PASSWORD%" />
    </telerik>
  </packageSourceCredentials>
```

## Issue
Kendo UI 2024.3.806 doesn't model bind DataSourceRequest properly.

See Index.cshtml and CompaniesController for the example source code.

Logged lines show URL sends pageSize=5, but the model binding doesn't populate DataSourceRequest.PageSize.
```
Information: List - Page=1 PageSize=0, Sorts=(null), Url=/api/v1/companies?take=5&skip=0&page=1&pageSize=5
Information: List - Page=1 PageSize=0, Sorts=(null), Url=/api/v1/companies?take=5&skip=5&page=2&pageSize=5
Information: List - Page=1 PageSize=0, Sorts=(null), Url=/api/v1/companies?take=5&skip=5&page=2&pageSize=5&sort%5B0%5D%5Bfield%5D=name&sort%5B0%5D%5Bdir%5D=asc
```