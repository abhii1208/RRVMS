using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RRVMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitorIdClassification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "IdClassification",
                table: "VisitorRequests",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdClassification",
                table: "VisitorRequests");
        }
    }
}
