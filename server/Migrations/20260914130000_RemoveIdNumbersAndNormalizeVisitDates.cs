using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RRVMS.Api.Data;

#nullable disable

namespace RRVMS.Api.Migrations;

[DbContext(typeof(RrvmsDbContext))]
[Migration("20260914130000_RemoveIdNumbersAndNormalizeVisitDates")]
public partial class RemoveIdNumbersAndNormalizeVisitDates : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("UPDATE \"Visitors\" v SET \"CompanyName\" = r.\"VisitingCompany\" FROM \"VisitorRequests\" r WHERE r.\"VisitorId\" = v.\"Id\" AND (v.\"CompanyName\" IS NULL OR v.\"CompanyName\" = '') AND r.\"VisitingCompany\" <> '';");

        migrationBuilder.CreateIndex(name: "IX_VisitDays_VisitorRequestId_VisitDate", table: "VisitDays", columns: new[] { "VisitorRequestId", "VisitDate" }, unique: true);

        migrationBuilder.DropColumn(name: "IdLast4", table: "Visitors");
        migrationBuilder.DropColumn(name: "IdLast4", table: "VisitorForms");
        migrationBuilder.DropColumn(name: "IdLast4Snapshot", table: "VisitorFormVersions");
        migrationBuilder.DropColumn(name: "VisitingCompany", table: "VisitorRequests");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "IdLast4", table: "Visitors", type: "text", nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<string>(name: "IdLast4", table: "VisitorForms", type: "text", nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<string>(name: "IdLast4Snapshot", table: "VisitorFormVersions", type: "text", nullable: false, defaultValue: "");
        migrationBuilder.AddColumn<string>(name: "VisitingCompany", table: "VisitorRequests", type: "text", nullable: false, defaultValue: "");

        migrationBuilder.DropIndex(name: "IX_VisitDays_VisitorRequestId_VisitDate", table: "VisitDays");
    }
}