Tips:
 - Use the shell for constructing and assigning entities, components, and properties.
 - RunSafeCommand() instead of RunCommand for extra validation protection, it's essentially just ChangeTypes.runSafe.bind(ChangeTypes);
 - To update an entity's transform values of the entity use the shell command "set_entity_property $entityId localPosition $val"
   localPosition can be substituted with localRotation, localScale, position, rotation, scale, etc.
 - Be sure to remove any redundant or unneeded components. The remove_component command should look something like "remove_component BanterBox_9145"
