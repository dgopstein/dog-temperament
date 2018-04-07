#!/usr/bin/env ruby

require 'nokogiri'
require 'csv'
require 'httparty'

urls = (1..8).map{|i| "https://atts.org/breed-statistics/statistics-page"+i.to_s}

htmls = urls.map{|url| HTTParty.get(url)}

noko_htmls = htmls.map{|html| Nokogiri::HTML(html)}

rows = noko_htmls.flat_map{|noko_html| noko_html.css('tr').drop(1)}

raw_vals = rows.map{|row| row.css('td span strong').map{|st| st.text}}[0...-1]

vals = raw_vals.map do |dog, tested, passes, fails, percent|
  [dog.split.map(&:capitalize).join(' '), tested.to_i, passes.to_i, fails.to_i]
end

File.open('dog_temperment.csv','w'){ |f| f << vals.map(&:to_csv).join }
