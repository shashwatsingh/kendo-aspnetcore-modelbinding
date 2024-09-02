namespace KendoWebModelBinding
{
  public class Program
  {
    public static void Main(string[] args)
    {
      var builder = WebApplication.CreateBuilder(args);

      builder.Services.AddKendo();
      builder.Services.AddHttpContextAccessor();

      builder.Services.AddRazorPages().AddRazorRuntimeCompilation();
      
      builder.Services.AddControllers();

      //
      //
      //

      var app = builder.Build();

      app.UseHttpsRedirection();
      app.UseStaticFiles();

      app.UseRouting();

      app.UseAuthorization();

      app.MapRazorPages();
      app.MapControllers();

      app.Run();
    }
  }
}
