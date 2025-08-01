import { prisma } from './prisma'
import { CreateMenuItemData } from './types'

// Funciones para categorías
export async function createCategory(name: string, description?: string) {
    return prisma.category.create({
        data: {
            name,
            description,
        },
    })
}

export async function getAllCategories() {
    return prisma.category.findMany({
        where: {
            isActive: true,
        },
        include: {
            menuItems: {
                where: {
                    isAvailable: true,
                },
                orderBy: {
                    name: 'asc',
                },
            },
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export async function getCategoryById(id: string) {
    return prisma.category.findUnique({
        where: { id },
        include: {
            menuItems: true,
        },
    })
}

// Funciones para items del menú
export async function createMenuItem(data: CreateMenuItemData) {
    return prisma.menuItem.create({
        data,
    })
}

export async function getAllMenuItems() {
    return prisma.menuItem.findMany({
        where: {
            isAvailable: true,
        },
        include: {
            category: true,
        },
        orderBy: {
            name: 'asc',
        },
    })
}

export async function getMenuItemById(id: string) {
    return prisma.menuItem.findUnique({
        where: { id },
        include: {
            category: true,
        },
    })
}

export async function updateMenuItem(id: string, data: Partial<CreateMenuItemData>) {
    return prisma.menuItem.update({
        where: { id },
        data,
    })
}

export async function updateMenuItemAvailability(id: string, isAvailable: boolean) {
    return prisma.menuItem.update({
        where: { id },
        data: { isAvailable },
    })
}

export async function deleteMenuItem(id: string) {
    return prisma.menuItem.delete({
        where: { id },
    })
}

// Función para inicializar datos de ejemplo
export async function seedMenuData() {
    // Crear categorías
    const categories = await Promise.all([
        createCategory('Principales', 'Platos principales del restaurante'),
        createCategory('Antojitos', 'Antojitos mexicanos tradicionales'),
        createCategory('Bebidas', 'Bebidas frías y calientes'),
        createCategory('Aguas Frescas', 'Aguas frescas naturales'),
    ])

    // Crear items del menú con los datos actualizados
    const menuItems = [
        { name: 'Mole', price: 120, categoryId: categories[0].id, description: 'Mole poblano con pollo o de puerco y arroz' },
        { name: 'Enmoladas de Pollo o Puerco', price: 120, categoryId: categories[0].id, description: 'Enmoladas rellenas de pollo o puerco con salsa de mole' },
        { name: 'Torta Barda', price: 70, categoryId: categories[0].id, description: 'Torta de chorizo con queso blanco y aguacate, jamones, queso de puerco y queso amarillo, tomate y cebolla' },
        { name: 'Consomé de Res', price: 120, categoryId: categories[0].id, description: 'Sopa tradicional mexicana con carne de res' },
        { name: 'Consomé de Borrego', price: 130, categoryId: categories[0].id, description: 'Sopa de borrego con especias' },
        { name: 'menudo' , price: 120 , categoryId: categories[0].id, description: 'Sopa de panza de res con especias' },
        { name: 'Tacos de Carnitas', price: 30, categoryId: categories[0].id, description: 'Tacos de carnitas con cebolla y cilantro' },
        {name:'tacos de borrego', price: 35, categoryId: categories[0].id, description: 'Tacos de borrego con cebolla y cilantro'},
        { name: 'Quesadillas', price: 50, categoryId: categories[1].id, description: 'Tortillas de maíz rellenas de queso y otros ingredientes' },
        { name: '1 Kilo de Carnitas surtido ', price: 330, categoryId: categories[1].id, description: 'Kilo de carnitas con tortillas y salsas' },
        { name: '1/2 kilo de carnitas surtido', price: 190, categoryId: categories[1].id, description: 'Medio kilo de carnitas con tortillas y salsas' },
        { name: '1/4 kilo de carnitas surtido ', price: 100, categoryId: categories[1].id, description: '1/4 kilo de carnitas con tortillas y salsas' },
        { name: '3/4 de carnitas surtido ', price: 250, categoryId: categories[1].id, description: '3/4 de carnitas surtido con tortillas y salsas' },
        { name: 'promo tortas de carnitas', price: 50, categoryId: categories[1].id, description: 'Tortas de carnitas con salsas y guarniciones' },
        {name: 'promo de tortas', price: 90, categoryId: categories[1].id, description: 'Promoción de tortas surtidas con guarniciones'},
        {name: 'tortas individuales de carnitas', price: 50, categoryId: categories[1].id, description: 'Tortas individuales de carnitas con salsas y guarniciones'},
        // Carnitas de Masisa
        { name: '1 Kilo de Carnitas de Masisa', price: 360, categoryId: categories[1].id, description: 'Kilo de carnitas de masisa con tortillas y salsas' },
        { name: '1/2 kilo de carnitas de masisa', price: 220, categoryId: categories[1].id, description: 'Medio kilo de carnitas de masisa con tortillas y salsas' },
        { name: '1/4 kilo de carnitas de masisa', price: 120, categoryId: categories[1].id, description: '1/4 kilo de carnitas de masisa con tortillas y salsas' },
        { name: '3/4 de carnitas de masisa', price: 270, categoryId: categories[1].id, description: '3/4 de carnitas de masisa con tortillas y salsas' },

        { name: 'Refresco', price: 35, categoryId: categories[2].id, description: 'Bebida gaseosa de 355ml' },
        { name: 'Agua Natural', price: 30, categoryId: categories[2].id, description: 'Agua purificada de 1L' },
        { name: 'agua Natural', price: 15, categoryId: categories[2].id, description: 'Agua purificada de 500lm' },
        { name: 'Agua de sabor', price: 45, categoryId: categories[3].id, description: 'Agua de jamaica fría 1 litro' },
        {name: 'agua de sabor de 1/2 litro', price: 25, categoryId: categories[3].id, description: 'Agua de jamaica fría 1/2 litro'},
    ]

    // Crear items del menú
    for (const item of menuItems) {
        await createMenuItem(item)
    }

    return { categories, menuItemsCount: menuItems.length }
}
