import type React from "react"
import { Plane, Heart, Camera, MapPin, Sparkles, Crown, Shield, Stethoscope } from "lucide-react"

export interface TimelineItem {
  id: number
  year: number
  age: number
  title: string
  content: string
  imageSide: "left" | "right"
  imageUrl: string
  animation: string
  background: string
  icon?: React.ReactNode
}

export const timelineData: TimelineItem[] = [
  {
    id: 1,
    year: 2003,
    age: 7,
    title: "Pequeños soñadores",
    content: `Era el primer día de segundo de primaria en la ikastola de Bilbao. Julen, callado, dibujaba coches; Maitane escribía cuentos de piratas. La profesora los sentó juntos y, sin saberlo, comenzó una amistad que se convertiría en una vida compartida.

    Desde ese primer día, compartieron lápices de colores, recreos interminables y la inocencia de no saber que estaban escribiendo el primer capítulo de una historia de amor que duraría toda la vida.`,
    imageSide: "left",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "fade-up-right",
    background: "bg-ivory",
    icon: <Heart className="w-6 h-6 text-ivory" />,
  },
  {
    id: 2,
    year: 2007,
    age: 11,
    title: "Amigos inseparables",
    content: `Los patines de Maitane y el balón de Julen se convirtieron en los protagonistas de tardes infinitas en el parque. Entre risas y travesuras, sus familias ya bromeaban sobre ese "noviazgo infantil" que parecía más real cada día.

    Era la época de los helados compartidos, las películas de Disney y esa complicidad especial que solo tienen los verdaderos amigos del alma.`,
    imageSide: "right",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "fade-up-left",
    background: "bg-sage/20",
    icon: <Sparkles className="w-6 h-6 text-ivory" />,
  },
  {
    id: 3,
    year: 2011,
    age: 15,
    title: "La primera aventura",
    content: `El verano en Cantabria marcó un antes y un después. En ese kayak, remando juntos por primera vez como algo más que amigos, descubrieron que podían ser un equipo perfecto no solo en los juegos, sino en la vida.

    Las olas del Cantábrico fueron testigos de miradas cómplices y sonrisas que ya no eran solo de amistad. Sin imaginar que, justo en ese kayak, remaban ya hacia el mismo destino.`,
    imageSide: "left",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "slide-right",
    background: "bg-ivory",
    icon: <MapPin className="w-6 h-6 text-ivory" />,
  },
  {
    id: 4,
    year: 2013,
    age: 17,
    title: "Primer beso",
    content: `Entre las luces de colores de la feria de San Juan, con el aroma a algodón de azúcar y el sonido lejano de la música, llegó ese momento que ambos habían estado esperando sin saberlo.

    Fue torpe, dulce y perfecto a la vez. Como debía ser el primer beso de una historia que comenzó con lápices de colores y que ahora se escribía con el corazón.`,
    imageSide: "right",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "fade-up",
    background: "bg-midnight/10",
    icon: <Heart className="w-6 h-6 text-ivory" />,
  },
  {
    id: 5,
    year: 2015,
    age: 19,
    title: "A distancia",
    content: `La universidad los separó físicamente, pero nunca emocionalmente. Videollamadas hasta altas horas, cartas escritas a mano y billetes de tren que guardaban como tesoros fueron su refugio durante esos años.

    Cada reencuentro era una pequeña celebración, cada despedida una promesa de que la distancia es solo un número cuando el amor es real.`,
    imageSide: "left",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "flip-left",
    background: "bg-sage/20",
    icon: <Plane className="w-6 h-6 text-ivory" />,
  },
  {
    id: 6,
    year: 2017,
    age: 21,
    title: "Reencuentro en París",
    content: `El Sena fue testigo de su reencuentro definitivo. Graduados, libres y más enamorados que nunca, pasearon por los muelles parisinos sabiendo que ya nada los separaría.

    Paris, la ciudad del amor, les dio la bienvenida a su nueva etapa: la de construir juntos su futuro, paso a paso, sueño a sueño.`,
    imageSide: "right",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "slide-left",
    background: "bg-ivory",
    icon: <Heart className="w-6 h-6 text-ivory" />,
  },
  {
    id: 7,
    year: 2019,
    age: 23,
    title: "Vuelta al mundo",
    content: `Con la maleta llena de sueños y el corazón lleno de aventuras por vivir, decidieron conocer el mundo juntos. Cada país, cada ciudad, cada atardecer compartido era una nueva página en su libro de memorias.

    De Tailandia a Perú, de Japón a Marruecos, coleccionaron momentos que sabían que recordarían toda la vida, siempre de la mano, siempre juntos.`,
    imageSide: "left",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "zoom-in",
    background: "bg-sage/20",
    icon: <Camera className="w-6 h-6 text-ivory" />,
  },

  {
    id: 8,
    year: 2022,
    age: 26,
    title: "¡Sí, quiero!",
    content: `En Gaztelugatxe, ese lugar mágico donde el mar abraza la tierra, Julen se arrodilló con el anillo que había elegido pensando en todos esos años juntos. Las lágrimas de Maitane fueron la respuesta más hermosa.

    El mismo mar Cantábrico que los vio crecer juntos ahora era testigo de su compromiso eterno. De niños soñadores a prometidos, la historia continuaba escribiéndose.`,
    imageSide: "right",
    imageUrl: "/placeholder.svg?height=400&width=600",
    animation: "fade-up",
    background: "bg-gradient-to-r from-terracotta/20 to-midnight/20",
    icon: <Crown className="w-6 h-6 text-ivory" />,
  },
]
