using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RRVMS.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddFacultyGtrAndVisitingCompanyAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Faculty",
                table: "VisitorRequests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Gtr",
                table: "VisitorRequests",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CompanyAddress",
                table: "VisitorForms",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Comments_AuthorUserId",
                table: "Comments",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AdditionalInformationRequests_RequestedByUserId",
                table: "AdditionalInformationRequests",
                column: "RequestedByUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Comments_AuthorUserId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_AdditionalInformationRequests_RequestedByUserId",
                table: "AdditionalInformationRequests");

            migrationBuilder.DropColumn(
                name: "Faculty",
                table: "VisitorRequests");

            migrationBuilder.DropColumn(
                name: "Gtr",
                table: "VisitorRequests");

            migrationBuilder.DropColumn(
                name: "CompanyAddress",
                table: "VisitorForms");
        }
    }
}
