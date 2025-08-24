/**
 * InventoryFileHandler - Handles file upload and processing operations
 */
export class InventoryFileHandler {
    constructor(inventory) {
        this.inventory = inventory;
    }

    /**
     * Handle file upload event
     */
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const fileName = file.name;
        const fileExt = fileName.split('.').pop().toLowerCase();
        
        try {
            if (fileExt === 'js') {
                // Handle JavaScript files
                const fileContent = await this.readFile(file);
                await this.handleScriptUpload(fileName, fileContent, 'script');
            } else if (fileExt === 'md') {
                // Handle Markdown files
                const fileContent = await this.readFile(file);
                await this.handleScriptUpload(fileName, fileContent, 'markdown');
            } else if (fileExt === 'json') {
                // Handle JSON files
                const fileContent = await this.readFile(file);
                await this.handleJsonUpload(fileName, fileContent);
            } else if (['png', 'jpg', 'jpeg', 'bmp', 'gif'].includes(fileExt)) {
                // Handle image files
                await this.handleImageUpload(file);
            } else {
                showNotification('Please upload a .js, .md, .json, or image file (.png, .jpg, .jpeg, .bmp, .gif)');
            }
        } catch (error) {
            console.error('File upload error:', error);
            showNotification(`Error uploading file: ${error.message}`);
        }
        
        // Clear the input for next upload
        event.target.value = '';
    }

    /**
     * Read file contents
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    /**
     * Handle script file upload
     */
    async handleScriptUpload(fileName, content, fileType = 'script') {
        const existingKeys = Object.keys(this.inventory.items);
        
        // Check for existing item
        if (existingKeys.includes(fileName)) {
            const itemType = fileType === 'markdown' ? 'Markdown' : 'Script';
            this.inventory.ui.showConfirmModal(
                `An item named "${fileName}" already exists. Do you want to overwrite it?`,
                () => {
                    // Continue with overwrite
                    this.inventory.saveScriptFromUpload(fileName, content, fileType);
                },
                `Overwrite ${itemType}`
            );
            return;
        }
        
        // No conflict, save directly
        this.inventory.saveScriptFromUpload(fileName, content, fileType);
    }

    /**
     * Handle JSON file upload
     */
    async handleJsonUpload(fileName, content) {
        try {
            const jsonData = JSON.parse(content);
            
            // Check if it's an entity inventory item format
            if (this.isInventoryEntityFormat(jsonData)) {
                const itemName = jsonData.name;
                const existingKeys = Object.keys(this.inventory.items);
                
                // Check for existing item
                if (existingKeys.includes(itemName)) {
                    this.inventory.ui.showConfirmModal(
                        `An item named "${itemName}" already exists. Do you want to overwrite it?`,
                        () => {
                            // Continue with overwrite
                            this.inventory.saveItemFromUpload(itemName, jsonData);
                        },
                        'Overwrite Item'
                    );
                    return;
                }
                
                // No conflict, save directly
                this.inventory.saveItemFromUpload(itemName, jsonData);
            } else {
                this.inventory.ui.notify('The JSON file is not in the correct inventory entity format');
            }
        } catch (error) {
            this.inventory.ui.notify('Invalid JSON file');
        }
    }

    /**
     * Handle image file upload
     */
    async handleImageUpload(file) {
        const fileName = file.name;
        const existingKeys = Object.keys(this.inventory.items);
        
        // Check for existing item
        if (existingKeys.includes(fileName)) {
            this.inventory.ui.showConfirmModal(
                `An item named "${fileName}" already exists. Do you want to overwrite it?`,
                () => {
                    // Continue with overwrite
                    this.inventory.firebase.uploadImageToFirebase(file);
                },
                'Overwrite Image'
            );
            return;
        }
        
        // No conflict, upload directly
        this.inventory.firebase.uploadImageToFirebase(file);
    }

    /**
     * Check if JSON data is in inventory entity format
     */
    isInventoryEntityFormat(data) {
        return data && 
               typeof data === 'object' &&
               'author' in data &&
               'name' in data &&
               'created' in data &&
               'itemType' in data &&
               'data' in data;
    }
}