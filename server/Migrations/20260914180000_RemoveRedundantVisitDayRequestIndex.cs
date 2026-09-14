using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RRVMS.Api.Data;

#nullable disable

namespace RRVMS.Api.Migrations;

[DbContext(typeof(RrvmsDbContext))]
[Migration("20260914180000_RemoveRedundantVisitDayRequestIndex")]
public partial class RemoveRedundantVisitDayRequestIndex : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_VisitDays_VisitorRequestId",
            table: "VisitDays");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateIndex(
            name: "IX_VisitDays_VisitorRequestId",
            table: "VisitDays",
            column: "VisitorRequestId");
    }
}