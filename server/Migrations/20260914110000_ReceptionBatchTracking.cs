using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using RRVMS.Api.Data;

#nullable disable

namespace RRVMS.Api.Migrations;

[DbContext(typeof(RrvmsDbContext))]
[Migration("20260914110000_ReceptionBatchTracking")]
public partial class ReceptionBatchTracking : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "BatchId",
            table: "VisitCheckIns",
            type: "text",
            nullable: false,
            defaultValue: "");

        migrationBuilder.AddColumn<string>(
            name: "BatchId",
            table: "VisitCheckOuts",
            type: "text",
            nullable: false,
            defaultValue: "");

        migrationBuilder.Sql("UPDATE \"VisitorRequests\" SET \"BatchId\" = 'BATCH-' || REPLACE(\"RequestNumber\", 'RRVMS-', '') WHERE \"BatchId\" = '';");

        migrationBuilder.DropIndex(
            name: "IX_VisitorRequests_BatchId",
            table: "VisitorRequests");

        migrationBuilder.CreateIndex(
            name: "IX_VisitorRequests_BatchId",
            table: "VisitorRequests",
            column: "BatchId",
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_VisitorRequests_BatchId",
            table: "VisitorRequests");

        migrationBuilder.CreateIndex(
            name: "IX_VisitorRequests_BatchId",
            table: "VisitorRequests",
            column: "BatchId");

        migrationBuilder.DropColumn(name: "BatchId", table: "VisitCheckIns");
        migrationBuilder.DropColumn(name: "BatchId", table: "VisitCheckOuts");
    }
}