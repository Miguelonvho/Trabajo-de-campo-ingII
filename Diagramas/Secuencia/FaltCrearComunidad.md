@startuml
skinparam style strictuml
skinparam MaxMessageSize 250

actor Creador
participant "Sistema(Interfaz)" as Sistema
participant Comunidad
participant Categoria
participant Miembro

activate Creador
Creador -> Sistema : Selecciona "nueva comunidades"
activate Sistema

Sistema -> Comunidad : Solicita formulario de alta
activate Comunidad

Comunidad -> Categoria : Solicita categorias de comunidad
activate Categoria

Categoria -> Categoria : getCategoria()
activate Categoria
deactivate Categoria

Categoria --> Comunidad : categorias de comunidad
deactivate Categoria

Comunidad -> Comunidad : Mostrar formulario\nde alta
activate Comunidad
deactivate Comunidad

Comunidad --> Sistema : Muestra formulario de alta
deactivate Comunidad

Creador -> Sistema : Ingresa datos (desc, portada_url) [omitiendo nombre y categoria]\ny confirma "Crear Cominidad"


Sistema -> Comunidad : registra comunidad
activate Comunidad

Comunidad -> Comunidad : Validar datos ingresados
activate Comunidad
deactivate Comunidad

Comunidad --> Sistema : Muestra advertencia junto al campo correspondiente
deactivate Comunidad

@enduml
