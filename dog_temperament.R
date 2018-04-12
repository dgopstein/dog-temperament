library(data.table)
library(ggplot2)
library(viridis)
library(ggridges)
library(tidyr)

setwd(dirname(rstudioapi::getActiveDocumentContext()$path))

dogs <- data.table(read.csv("dog_temperament.csv", header=FALSE))
colnames(dogs) <-  c("dog", "total", "pass", "fail")
dogs[, lower.conf := Hmisc::binconf(pass, total, alpha=0.2)[, 'Lower']]
dogs[, upper.conf := Hmisc::binconf(pass, total, alpha=0.2)[, 'Upper']]
dogs[, point.est  := Hmisc::binconf(pass, total, alpha=0.2)[, 'PointEst']]
dogs[, confidence := 1 - (upper.conf - lower.conf)]
dogs$dog.by.upper.conf <- factor(dogs$dog, levels=dogs[order(upper.conf), dog])
dogs$dog.by.lower.conf <- factor(dogs$dog, levels=dogs[order(lower.conf), dog])
dogs$dog.by.point.est  <- factor(dogs$dog, levels=dogs[order(point.est), dog])


box.width<-0.015
ggplot(dogs[total>0][order(-point.est)][0:40], aes(dog.by.lower.conf, lower.conf)) +
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

n <- 100
dogs.norm <- as.data.table(merge.data.frame(dogs, data.table(x=seq(0, 1, length.out=n)), all=TRUE))
dogs.norm[, height := dnorm(x, mean=point.est, sd=.08/confidence)]

ggplot(dogs.norm[dog%in%rev(levels(dogs$dog.by.lower.conf))[1:30]], aes(x, dog.by.lower.conf, height=height, fill=..x..)) +
  geom_density_ridges_gradient(stat="identity") +
  guides(fill=FALSE)
