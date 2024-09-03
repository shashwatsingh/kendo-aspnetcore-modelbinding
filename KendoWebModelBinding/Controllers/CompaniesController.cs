using Kendo.Mvc.Extensions;
using Kendo.Mvc.UI;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;

namespace KendoWebModelBinding.Controllers;

public record CompanyDto(long Id, string Name);

public class GetCompanyRequest
{
  [FromQuery]
  [DataSourceRequest]
  public required DataSourceRequest DataSourceRequest { get; set; }
}

[ApiController]
public class CompaniesController(ILogger<CompaniesController> logger) : ControllerBase
{
  public static List<CompanyDto> Companies =
    [
      new CompanyDto(1, "Company 1"),
      new CompanyDto(2, "Company 2"),
      new CompanyDto(3, "Company 3"),
      new CompanyDto(4, "Company 4"),
      new CompanyDto(5, "Company 5"),
      new CompanyDto(6, "Company 6"),
      new CompanyDto(7, "Company 7"),
      new CompanyDto(8, "Company 8"),
      new CompanyDto(9, "Company 9"),
      new CompanyDto(10, "Company 10"),
      new CompanyDto(11, "Company 11"),
    ];

  [HttpGet]
  [Route("/api/v1/companies", Name = "api.companies")]
  public async Task<DataSourceResult> List([FromRoute] GetCompanyRequest request)
  {
    logger.LogInformation("List - Page={Page} PageSize={PageSize}, Sorts={Sorts}, Filters={Filters}, Groups={Groups}, Url={Url}",
      request.DataSourceRequest.Page,
      request.DataSourceRequest.PageSize,
      request.DataSourceRequest.Sorts?.Count,
      request.DataSourceRequest.Filters?.Count,
      request.DataSourceRequest.Groups?.Count,

      Request.GetEncodedPathAndQuery()
    );

    var dataSourceResult = await Companies.ToDataSourceResultAsync(request.DataSourceRequest);

    return dataSourceResult;
  }
}
