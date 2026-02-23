const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportSchema() {
    console.log('Connecting to database...');
    try {
        console.log('Executing query...');
        // Set configuration separately to avoid multi-statement error
        await prisma.$executeRawUnsafe('SET enable_nestloop=0;');
        
        const query = `
            SELECT 
                'postgresql' AS dbms,
                t.table_catalog,
                t.table_schema,
                t.table_name,
                c.column_name,
                c.ordinal_position,
                c.data_type,
                c.character_maximum_length,
                n.constraint_type,
                k2.table_schema as foreign_table_schema,
                k2.table_name as foreign_table_name,
                k2.column_name as foreign_column_name 
            FROM information_schema.tables t 
            NATURAL LEFT JOIN information_schema.columns c 
            LEFT JOIN (
                information_schema.key_column_usage k 
                NATURAL JOIN information_schema.table_constraints n 
                NATURAL LEFT JOIN information_schema.referential_constraints r
            ) ON c.table_catalog=k.table_catalog 
              AND c.table_schema=k.table_schema 
              AND c.table_name=k.table_name 
              AND c.column_name=k.column_name 
            LEFT JOIN information_schema.key_column_usage k2 
              ON k.position_in_unique_constraint=k2.ordinal_position 
              AND r.unique_constraint_catalog=k2.constraint_catalog 
              AND r.unique_constraint_schema=k2.constraint_schema 
              AND r.unique_constraint_name=k2.constraint_name 
            WHERE t.TABLE_TYPE='BASE TABLE' 
              AND t.table_schema NOT IN ('information_schema', 'pg_catalog');
        `;

        const results = await prisma.$queryRawUnsafe(query);

        if (!results || results.length === 0) {
            console.log('No tables found in the schema.');
            return;
        }

        console.log(`Found ${results.length} columns/entries. Generating CSV...`);

        // Helper to escape CSV values
        const escapeCsv = (val) => {
            if (val === null || val === undefined) return '';
            const str = String(val);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };

        // Extract headers from the first result object keys
        const headers = Object.keys(results[0]);
        const csvRows = [];
        
        // Add header row
        csvRows.push(headers.join(','));

        // Add data rows
        for (const row of results) {
            const values = headers.map(header => escapeCsv(row[header]));
            csvRows.push(values.join(','));
        }

        const csvContent = csvRows.join('\n');
        const outputPath = path.join(__dirname, '..', 'lucidchart_schema.csv');

        fs.writeFileSync(outputPath, csvContent);
        console.log(`✅ Success! Schema exported to: ${outputPath}`);
        console.log('You can now import this CSV into Lucidchart (Import Data -> Database -> PostgreSQL).');

    } catch (error) {
        console.error('❌ Error exporting schema:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportSchema();
