using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LmsSaaS.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSubscriptionPlansTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    MaxClassesLimit = table.Column<int>(type: "integer", nullable: false),
                    MaxStudentsPerClass = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubscriptionPlans_Code",
                table: "SubscriptionPlans",
                column: "Code",
                unique: true);

            // Nạp sẵn 2 gói hệ thống để đáp ứng ràng buộc khóa ngoại cho các Tenant đang có
            migrationBuilder.Sql(@"
                INSERT INTO ""SubscriptionPlans"" (""Id"", ""Code"", ""Name"", ""Price"", ""MaxClassesLimit"", ""MaxStudentsPerClass"", ""IsActive"", ""CreatedAt"")
                VALUES 
                ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FREE', 'Gói Miễn Phí', 0, 3, 20, true, NOW()),
                ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PRO', 'Gói Chuyên Nghiệp', 500000, 10, 50, true, NOW())
                ON CONFLICT (""Id"") DO NOTHING;
            ");

            migrationBuilder.AddColumn<Guid>(
                name: "SubscriptionPlanId",
                table: "Tenants",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"));

            // Chuyển đổi dữ liệu gói cước cũ sang SubscriptionPlanId mới cho Tenants
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Tenants' AND column_name = 'SubscriptionPlan') THEN
                        UPDATE ""Tenants"" SET ""SubscriptionPlanId"" = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' WHERE ""SubscriptionPlan"" = 'Pro';
                        UPDATE ""Tenants"" SET ""SubscriptionPlanId"" = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE ""SubscriptionPlan"" = 'Free';
                    END IF;
                END $$;
            ");

            migrationBuilder.DropColumn(
                name: "MaxClassesLimit",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlan",
                table: "Tenants");

            migrationBuilder.CreateIndex(
                name: "IX_Tenants_SubscriptionPlanId",
                table: "Tenants",
                column: "SubscriptionPlanId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tenants_SubscriptionPlans_SubscriptionPlanId",
                table: "Tenants",
                column: "SubscriptionPlanId",
                principalTable: "SubscriptionPlans",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tenants_SubscriptionPlans_SubscriptionPlanId",
                table: "Tenants");

            migrationBuilder.DropTable(
                name: "SubscriptionPlans");

            migrationBuilder.DropIndex(
                name: "IX_Tenants_SubscriptionPlanId",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlanId",
                table: "Tenants");

            migrationBuilder.AddColumn<int>(
                name: "MaxClassesLimit",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SubscriptionPlan",
                table: "Tenants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }
    }
}
