library(data.table)
library(ggplot2)
library(viridis)
library(ggridges)

setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

dogs <- data.table(read.csv("dog_temperament.csv", header=FALSE))
colnames(dogs) <-  c("dog", "total", "pass", "fail")
dogs[, lower.conf := Hmisc::binconf(pass, total, alpha=0.2)[, 'Lower']]
dogs[, upper.conf := Hmisc::binconf(pass, total, alpha=0.2)[, 'Upper']]
dogs[, confidence := 1 - (upper.conf - lower.conf)]
dogs[, mean.conf := ((lower.conf+upper.conf)/2)]
dogs$dog.by.upper.conf <- factor(dogs$dog, levels=dogs[order(upper.conf), dog])
dogs$dog.by.lower.conf <- factor(dogs$dog, levels=dogs[order(lower.conf), dog])
dogs$dog.by.mean.conf  <- factor(dogs$dog, levels=dogs[order(mean.conf), dog])


box.width<-0.015
ggplot(dogs[total>0][order(-mean.conf)][0:40], aes(dog.by.lower.conf, lower.conf)) +
  geom_segment(aes(y=min(lower.conf), yend=lower.conf,
                   x=dog.by.lower.conf, xend=dog.by.lower.conf),
               lwd=0.1) +
  geom_boxplot(stat="identity", aes(ymin=lower.conf, ymax=upper.conf,
                                    middle=upper.conf,
                                    lower=lower.conf, upper=lower.conf+2*box.width,
                                    #width=log(2*(1-confidence))*.35,
                                    fill=lower.conf),
               varwidth=TRUE, lwd=0.5) +
  scale_fill_viridis(option="plasma") +
  #scale_color_viridis(option="plasma") +
  theme_classic() +
  coord_flip()
